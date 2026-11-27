import { BadRequestException, HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import { CategoriesService } from "../categories/categories.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { ThumbnailStorage } from "./thumbnail.storage.js";
import { BookmarkThumbnailsService } from "./bookmark-thumbnails.service.js";
import {
  type BookmarkFilter,
  type BookmarkRecord,
  BookmarksRepository,
  TagLimitExceededError,
} from "./bookmarks.repository.js";
import { decodeCursor, encodeCursor, isUuid } from "./lib/cursor.js";
import {
  MAX_TAGS_PER_BOOKMARK,
  type TagName,
  uniqueTagNames,
} from "./lib/normalize-tag.js";
import { type NormalizeUrlError, normalizeUrl } from "./lib/normalize-url.js";

// 승인된 문구(docs/features/bookmark-save.md 오류 표)
const URL_ERROR_MESSAGES: Record<NormalizeUrlError, string> = {
  INVALID_URL: "올바른 링크 주소가 아니에요.",
  UNSUPPORTED_SCHEME: "http나 https로 시작하는 링크만 저장할 수 있어요.",
  URL_TOO_LONG: "링크 주소가 너무 길어요.",
};
// docs/features/bookmark-list-delete.md 오류 표
const NOT_FOUND_MESSAGE = "링크를 찾을 수 없어요.";
const ALREADY_SAVED_MESSAGE = "같은 링크가 이미 저장되어 있어요.";
// docs/features/bookmark-meta.md 오류 표(FEAT-010)
const META_INVALID_MESSAGE = "제목은 100자, 태그는 30자까지 입력할 수 있어요.";
const TITLE_INVALID_MESSAGE = "제목은 100자까지 입력할 수 있어요.";
const NOTHING_TO_UPDATE_MESSAGE = "고칠 내용을 보내 주세요.";
const BOOKMARK_TAG_LIMIT_MESSAGE = "링크 하나에 태그는 10개까지 달 수 있어요.";
const TAG_LIMIT_MESSAGE = "태그는 500개까지 만들 수 있어요.";
export const MAX_TITLE_LENGTH = 100;

export type SaveBookmarkInput = {
  url: string;
  title?: string;
  tags?: string[];
};

export type SaveBookmarkResult = { bookmark: BookmarkRecord; created: boolean };
export type BookmarkPage = {
  items: BookmarkRecord[];
  nextCursor: string | null;
};

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarks: BookmarksRepository,
    private readonly thumbnails: BookmarkThumbnailsService,
    private readonly storage: ThumbnailStorage,
    private readonly categories: CategoriesService,
  ) {}

  // FEAT-001: 활성 북마크가 있으면 재사용(AC-02), 없으면 생성(AC-01). 휴지통에만 있으면 그 행을 영구 삭제하고
  // 새로 넣은 것처럼 저장한다(AC-07, ADR-017 — 이전 D-01의 409 복구 안내를 대체).
  // 동시 요청은 insertIfAbsent의 ON CONFLICT가 하나만 통과시키고 나머지는 승자를 다시 읽는다(AC-03)
  // FEAT-010: 새로 저장할 때만 제목·태그를 붙이고 썸네일 수집을 건다. 이미 있는 링크는 그대로 돌려준다(AC-03)
  async save(
    userId: string,
    input: SaveBookmarkInput,
  ): Promise<SaveBookmarkResult> {
    const { url } = input;
    const normalized = normalizeUrl(url);
    if (!normalized.ok) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        normalized.error,
        URL_ERROR_MESSAGES[normalized.error],
      );
    }
    const { normalizedUrl } = normalized;

    const latest = await this.bookmarks.findLatestByUrl(userId, normalizedUrl);
    if (latest?.deletedAt === null) return { bookmark: latest, created: false };
    if (latest) await this.purgeTrashed(userId, normalizedUrl);

    const meta = parseMeta(input);
    let inserted: BookmarkRecord | null;
    try {
      inserted = await this.bookmarks.insertIfAbsent(
        userId,
        url,
        normalizedUrl,
        meta,
      );
    } catch (error) {
      if (error instanceof TagLimitExceededError) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "TAG_LIMIT",
          TAG_LIMIT_MESSAGE,
        );
      }
      throw error;
    }
    if (inserted) {
      this.thumbnails.enqueue(inserted.id, normalizedUrl);
      return { bookmark: inserted, created: true };
    }

    // 충돌한 행은 이미 커밋됐다. 새 쿼리라 보인다(같은 문장 안의 조회는 이전 스냅샷이라 못 볼 수 있다)
    const winner = await this.bookmarks.findActiveByUrl(userId, normalizedUrl);
    if (winner) return { bookmark: winner, created: false };
    // 충돌 직후 승자가 삭제된 경우(동시 저장·삭제). 휴지통의 그 행을 지우고 한 번만 다시 넣는다
    await this.purgeTrashed(userId, normalizedUrl);
    const retried = await this.bookmarks.insertIfAbsent(
      userId,
      url,
      normalizedUrl,
      meta,
    );
    if (retried) {
      this.thumbnails.enqueue(retried.id, normalizedUrl);
      return { bookmark: retried, created: true };
    }
    const again = await this.bookmarks.findActiveByUrl(userId, normalizedUrl);
    if (again) return { bookmark: again, created: false };
    throw new Error("Bookmark disappeared after insert conflict");
  }

  // ADR-017. 썸네일 파일 삭제는 실패해도 저장을 막지 않는다(파일만 남는다)
  private async purgeTrashed(userId: string, normalizedUrl: string) {
    const keys = await this.bookmarks.purgeDeletedByUrl(userId, normalizedUrl);
    await Promise.all(
      keys.map((key) => this.storage.remove(key).catch(() => {})),
    );
  }

  // FEAT-002 AC-01~03, FEAT-008 AC-11(카테고리·미분류 필터. 함께 줄 수 없다)
  async list(
    userId: string,
    status: "active" | "deleted",
    limit: number,
    cursor: string | undefined,
    filter: BookmarkFilter = {},
  ): Promise<BookmarkPage> {
    if (filter.categoryId !== undefined && filter.uncategorized) {
      throw new BadRequestException([
        "categoryId and uncategorized cannot be used together",
      ]);
    }
    const after = cursor === undefined ? null : decodeCursor(cursor);
    if (cursor !== undefined && !after) {
      // ValidationPipe와 같은 형태 → 공통 VALIDATION_FAILED
      throw new BadRequestException(["cursor must be a value from nextCursor"]);
    }
    const rows =
      status === "active"
        ? await this.bookmarks.listActive(userId, limit, after, filter)
        : await this.bookmarks.listDeleted(userId, limit, after, filter);
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({
              at: status === "active" ? last.createdAt : last.deletedAt!,
              id: last.id,
            })
          : null,
    };
  }

  // FEAT-010 업로드 응답용. 소유한 것만
  async get(userId: string, id: string): Promise<BookmarkRecord> {
    const owned = isUuid(id)
      ? await this.bookmarks.findOwned(userId, id)
      : null;
    if (!owned) throw notFound();
    return owned;
  }

  // FEAT-011 AC-01~03. 활성 북마크의 제목만. 정규화는 저장할 때와 같다(FEAT-010 AC-01)
  // FEAT-011 AC-01~03(제목), FEAT-008 AC-09(카테고리 이동). 주어진 항목만 고친다
  async update(
    userId: string,
    id: string,
    input: { title?: string | null; categoryId?: string | null },
  ): Promise<BookmarkRecord> {
    if (!isUuid(id)) throw notFound();
    // 고칠 항목이 하나도 없으면 거부한다(FEAT-011 AC-03. 보낼 것이 없는 요청은 클라이언트 잘못)
    if (input.title === undefined && input.categoryId === undefined) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "VALIDATION_FAILED",
        NOTHING_TO_UPDATE_MESSAGE,
      );
    }
    const data: { title?: string | null; categoryId?: string | null } = {};

    if (input.title !== undefined) {
      const title = normalizeTitle(input.title);
      if (title && title.length > MAX_TITLE_LENGTH) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "VALIDATION_FAILED",
          TITLE_INVALID_MESSAGE,
        );
      }
      data.title = title;
    }

    if (input.categoryId !== undefined) {
      // null은 미분류. 남의·없는 카테고리는 404(AC-07)
      if (input.categoryId !== null) {
        await this.categories.requireOwned(userId, input.categoryId);
      }
      data.categoryId = input.categoryId;
    }

    const updated = await this.bookmarks.update(userId, id, data);
    if (!updated) throw notFound();
    return updated;
  }

  // FEAT-002 AC-04·07. 이미 삭제됐어도 성공(멱등)
  async remove(userId: string, id: string): Promise<void> {
    if (!isUuid(id)) throw notFound();
    if (await this.bookmarks.softDelete(userId, id, new Date())) return;
    if (!(await this.bookmarks.findOwned(userId, id))) throw notFound();
  }

  // FEAT-002 AC-05·06·07. 이미 활성이면 그대로(멱등)
  async restore(userId: string, id: string): Promise<BookmarkRecord> {
    if (!isUuid(id)) throw notFound();
    let restored: BookmarkRecord | null;
    try {
      restored = await this.bookmarks.restore(userId, id);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // 같은 정규화 URL의 활성 북마크가 이미 있다(부분 UNIQUE가 판정)
      const owned = await this.bookmarks.findOwned(userId, id);
      const active =
        owned &&
        (await this.bookmarks.findActiveByUrl(userId, owned.normalizedUrl));
      throw new ApiException(
        HttpStatus.CONFLICT,
        "BOOKMARK_ALREADY_SAVED",
        ALREADY_SAVED_MESSAGE,
        active ? { bookmarkId: active.id } : undefined,
      );
    }
    if (restored) return restored;
    const owned = await this.bookmarks.findOwned(userId, id);
    if (!owned) throw notFound();
    return owned;
  }
}

// FEAT-010 AC-01. 빈 제목은 없는 것으로 본다
function parseMeta(input: SaveBookmarkInput): {
  title: string | null;
  tags: TagName[];
} {
  const title = normalizeTitle(input.title);
  if (title && title.length > MAX_TITLE_LENGTH) throw metaInvalid();
  const tags = uniqueTagNames(input.tags ?? []);
  if (!tags) throw metaInvalid();
  if (tags.length > MAX_TAGS_PER_BOOKMARK) {
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "BOOKMARK_TAG_LIMIT",
      BOOKMARK_TAG_LIMIT_MESSAGE,
    );
  }
  return { title, tags };
}

// 앞뒤 공백 제거·연속 공백 1칸·NFC. 비면 없음(null)
export function normalizeTitle(raw: string | null | undefined): string | null {
  return raw?.normalize("NFC").trim().replace(/\s+/g, " ") || null;
}

function metaInvalid() {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    "VALIDATION_FAILED",
    META_INVALID_MESSAGE,
  );
}

// 다른 사용자의 ID·없는 ID·형식 오류를 구분하지 않는다(존재 여부 비노출, AC-07)
function notFound() {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    "BOOKMARK_NOT_FOUND",
    NOT_FOUND_MESSAGE,
  );
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
