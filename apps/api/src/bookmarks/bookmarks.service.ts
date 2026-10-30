import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import {
  type BookmarkRecord,
  BookmarksRepository,
} from "./bookmarks.repository.js";
import { type NormalizeUrlError, normalizeUrl } from "./lib/normalize-url.js";

// 승인된 문구(docs/features/bookmark-save.md 오류 표)
const URL_ERROR_MESSAGES: Record<NormalizeUrlError, string> = {
  INVALID_URL: "올바른 링크 주소가 아니에요.",
  UNSUPPORTED_SCHEME: "http나 https로 시작하는 링크만 저장할 수 있어요.",
  URL_TOO_LONG: "링크 주소가 너무 길어요.",
};
const BOOKMARK_DELETED_MESSAGE = "삭제한 링크예요. 복구할 수 있어요.";

export type SaveBookmarkResult = { bookmark: BookmarkRecord; created: boolean };

@Injectable()
export class BookmarksService {
  constructor(private readonly bookmarks: BookmarksRepository) {}

  // FEAT-001: 활성 북마크가 있으면 재사용(AC-02), 삭제된 것만 있으면 복구 안내(AC-07), 없으면 생성(AC-01).
  // 동시 요청은 insertIfAbsent의 ON CONFLICT가 하나만 통과시키고 나머지는 승자를 다시 읽는다(AC-03)
  async save(userId: string, url: string): Promise<SaveBookmarkResult> {
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
    if (latest) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        "BOOKMARK_DELETED",
        BOOKMARK_DELETED_MESSAGE,
        { bookmarkId: latest.id },
      );
    }

    const inserted = await this.bookmarks.insertIfAbsent(
      userId,
      url,
      normalizedUrl,
    );
    if (inserted) return { bookmark: inserted, created: true };

    // 충돌한 행은 이미 커밋됐다. 새 쿼리라 보인다(같은 문장 안의 조회는 이전 스냅샷이라 못 볼 수 있다)
    const winner = await this.bookmarks.findActiveByUrl(userId, normalizedUrl);
    if (winner) return { bookmark: winner, created: false };
    // 충돌 직후 승자가 삭제된 경우뿐이다. 삭제 기능이 생기기 전에는 도달하지 않는다
    throw new Error("Active bookmark disappeared after insert conflict");
  }
}
