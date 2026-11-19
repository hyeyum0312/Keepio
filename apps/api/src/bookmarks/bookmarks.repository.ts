import { Injectable } from "@nestjs/common";
import type {
  Prisma,
  ThumbnailSource,
  ThumbnailStatus,
} from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { Cursor } from "./lib/cursor.js";
import { MAX_TAGS_PER_USER, type TagName } from "./lib/normalize-tag.js";

export type BookmarkRecord = {
  id: string;
  originalUrl: string;
  normalizedUrl: string;
  createdAt: Date;
  deletedAt: Date | null;
  // FEAT-010
  title: string | null;
  pageTitle: string | null;
  thumbnailKey: string | null;
  thumbnailStatus: ThumbnailStatus;
  thumbnailSource: ThumbnailSource | null;
  // FEAT-010 AC-11. og:image 원본 주소
  thumbnailSourceUrl: string | null;
  tags: { id: string; name: string }[];
};

// 사용자 태그 상한(500)을 넘기면 트랜잭션을 되돌리고 서비스가 422로 바꾼다
export class TagLimitExceededError extends Error {
  constructor() {
    super("tag limit exceeded");
    this.name = "TagLimitExceededError";
  }
}

const RECORD_SELECT = {
  id: true,
  originalUrl: true,
  normalizedUrl: true,
  createdAt: true,
  deletedAt: true,
  title: true,
  pageTitle: true,
  thumbnailKey: true,
  thumbnailStatus: true,
  thumbnailSource: true,
  thumbnailSourceUrl: true,
  tags: { select: { tag: { select: { id: true, name: true } } } },
} as const satisfies Prisma.BookmarkSelect;

type Row = Prisma.BookmarkGetPayload<{ select: typeof RECORD_SELECT }>;

// 태그는 이름의 유니코드 순서(영문·숫자 → 한글)로 준다. DB 정렬은 collation에 따라 달라져(로컬·CI·운영) 쓰지 않는다
function byName(a: { name: string }, b: { name: string }) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

function toRecord(row: Row): BookmarkRecord {
  return { ...row, tags: row.tags.map((t) => t.tag).sort(byName) };
}

function toRecordOrNull(row: Row | null): BookmarkRecord | null {
  return row ? toRecord(row) : null;
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class BookmarksRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 활성 행이 있으면 그것을, 없으면 가장 최근에 삭제된 행을 준다
  async findLatestByUrl(
    userId: string,
    normalizedUrl: string,
  ): Promise<BookmarkRecord | null> {
    return toRecordOrNull(
      await this.prisma.bookmark.findFirst({
        where: { userId, normalizedUrl },
        orderBy: { deletedAt: { sort: "desc", nulls: "first" } },
        select: RECORD_SELECT,
      }),
    );
  }

  async findActiveByUrl(
    userId: string,
    normalizedUrl: string,
  ): Promise<BookmarkRecord | null> {
    return toRecordOrNull(
      await this.prisma.bookmark.findFirst({
        where: { userId, normalizedUrl, deletedAt: null },
        select: RECORD_SELECT,
      }),
    );
  }

  // ADR-017: 휴지통의 같은 링크를 영구 삭제하고, 지운 행의 썸네일 키를 돌려준다(파일은 부른 쪽이 지운다).
  // 태그 연결은 FK cascade로 함께 지워진다
  async purgeDeletedByUrl(
    userId: string,
    normalizedUrl: string,
  ): Promise<string[]> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId, normalizedUrl, deletedAt: { not: null } },
      select: { id: true, thumbnailKey: true },
    });
    if (rows.length === 0) return [];
    await this.prisma.bookmark.deleteMany({
      where: { userId, id: { in: rows.map((r) => r.id) } },
    });
    return rows.flatMap((r) => (r.thumbnailKey ? [r.thumbnailKey] : []));
  }

  // 활성 행과 충돌하면 아무것도 넣지 않고 null. 동시 요청의 승자는 부분 UNIQUE 인덱스가 정한다.
  // Prisma create는 충돌마다 DB 오류를 낸다(동시 100회면 99건). ON CONFLICT … WHERE는 Prisma API로 표현되지 않아 SQL로 쓴다
  // FEAT-010: 새 행이면 같은 트랜잭션에서 제목·태그를 붙이고 썸네일 상태는 pending으로 시작한다.
  // 태그 상한을 넘으면 북마크까지 되돌린다(TagLimitExceededError)
  async insertIfAbsent(
    userId: string,
    originalUrl: string,
    normalizedUrl: string,
    meta: { title: string | null; tags: TagName[] } = { title: null, tags: [] },
  ): Promise<BookmarkRecord | null> {
    const id = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO bookmarks (user_id, original_url, normalized_url, title, thumbnail_status)
        VALUES (${userId}::uuid, ${originalUrl}, ${normalizedUrl}, ${meta.title}, 'pending')
        ON CONFLICT (user_id, normalized_url) WHERE deleted_at IS NULL DO NOTHING
        RETURNING id`;
      const inserted = rows[0]?.id;
      if (inserted && meta.tags.length > 0) {
        await attachTags(tx, userId, inserted, meta.tags);
      }
      return inserted ?? null;
    });
    return id ? this.findOwned(userId, id) : null;
  }

  // FEAT-010 AC-04·05. 자동 수집 결과. 직접 올린 썸네일은 덮어쓰지 않는다(AC-06). 바뀌었으면 true
  async setAutoThumbnail(id: string, key: string): Promise<boolean> {
    const { count } = await this.prisma.bookmark.updateMany({
      where: { id, thumbnailStatus: "pending", thumbnailSource: null },
      data: {
        thumbnailKey: key,
        thumbnailStatus: "ready",
        thumbnailSource: "auto",
      },
    });
    return count === 1;
  }

  async failPendingThumbnail(id: string): Promise<void> {
    await this.prisma.bookmark.updateMany({
      where: { id, thumbnailStatus: "pending" },
      data: { thumbnailStatus: "failed" },
    });
  }

  // FEAT-010 AC-11. og:image 원본 주소. 처음 받은 값만 둔다
  async setThumbnailSourceUrl(id: string, url: string): Promise<void> {
    await this.prisma.bookmark.updateMany({
      where: { id, thumbnailSourceUrl: null },
      data: { thumbnailSourceUrl: url },
    });
  }

  // og:title은 처음 받은 값만 둔다
  async setPageTitle(id: string, pageTitle: string): Promise<void> {
    await this.prisma.bookmark.updateMany({
      where: { id, pageTitle: null },
      data: { pageTitle },
    });
  }

  // FEAT-010 AC-06. 활성 북마크만. 이전 파일 키를 돌려줘 서비스가 지운다
  async setUploadedThumbnail(
    userId: string,
    id: string,
    key: string,
  ): Promise<{ previousKey: string | null } | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.bookmark.findFirst({
        where: { id, userId, deletedAt: null },
        select: { thumbnailKey: true },
      });
      if (!current) return null;
      await tx.bookmark.update({
        where: { id },
        data: {
          thumbnailKey: key,
          thumbnailStatus: "ready",
          thumbnailSource: "upload",
        },
      });
      return { previousKey: current.thumbnailKey };
    });
  }

  // 서버 재시작으로 끝나지 못한 작업(FEAT-010 영향도). 오래된 pending을 실패로 돌린다
  async failStalePending(olderThan: Date): Promise<number> {
    const { count } = await this.prisma.bookmark.updateMany({
      where: { thumbnailStatus: "pending", createdAt: { lt: olderThan } },
      data: { thumbnailStatus: "failed" },
    });
    return count;
  }

  // 썸네일 파일 요청의 소유 확인은 서명으로 한다. 여기서는 키가 실제로 쓰이는지만 본다
  async isThumbnailInUse(key: string): Promise<boolean> {
    const found = await this.prisma.bookmark.findFirst({
      where: { thumbnailKey: key, deletedAt: null },
      select: { id: true },
    });
    return found !== null;
  }

  // FEAT-002 AC-01·02. limit+1개를 읽어 다음 페이지 여부를 안다. 키셋 조건: (created_at, id) < 커서
  async listActive(
    userId: string,
    limit: number,
    after: Cursor | null,
  ): Promise<BookmarkRecord[]> {
    const rows = await this.prisma.bookmark.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(after && keyset("createdAt", after)),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: RECORD_SELECT,
    });
    return rows.map(toRecord);
  }

  // FEAT-002 AC-03. 최근 삭제 순
  async listDeleted(
    userId: string,
    limit: number,
    after: Cursor | null,
  ): Promise<BookmarkRecord[]> {
    const rows = await this.prisma.bookmark.findMany({
      where: {
        userId,
        deletedAt: { not: null },
        ...(after && keyset("deletedAt", after)),
      },
      orderBy: [{ deletedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: RECORD_SELECT,
    });
    return rows.map(toRecord);
  }

  // 소유자 조건을 항상 함께 건다(다른 사용자의 ID는 없는 것과 같다, AC-07)
  async findOwned(userId: string, id: string): Promise<BookmarkRecord | null> {
    return toRecordOrNull(
      await this.prisma.bookmark.findFirst({
        where: { id, userId },
        select: RECORD_SELECT,
      }),
    );
  }

  // 활성일 때만 삭제 표시. 이미 삭제됐으면 0(멱등은 서비스가 판단)
  async softDelete(userId: string, id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.bookmark.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: now },
    });
    return count === 1;
  }

  // 삭제된 것만 되살린다. 같은 URL의 활성 북마크가 있으면 부분 UNIQUE가 거부한다(P2002, AC-06의 최종 권위)
  async restore(userId: string, id: string): Promise<BookmarkRecord | null> {
    const [restored] = await this.prisma.bookmark.updateManyAndReturn({
      where: { id, userId, deletedAt: { not: null } },
      data: { deletedAt: null },
      select: { id: true },
    });
    return restored ? this.findOwned(userId, restored.id) : null;
  }
}

function keyset(
  field: "createdAt" | "deletedAt",
  after: Cursor,
): Prisma.BookmarkWhereInput {
  return {
    OR: [
      { [field]: { lt: after.at } },
      { [field]: after.at, id: { lt: after.id } },
    ],
  };
}

// 새 이름만 만들고(동시 생성은 UNIQUE가 하나로) 링크에 연결한다. 상한은 트랜잭션 안에서 센다.
// 동시 요청이 겹치면 상한을 몇 개 넘을 수 있다(낮은 빈도·낮은 위험, FEAT-010 영향도)
async function attachTags(
  tx: Tx,
  userId: string,
  bookmarkId: string,
  tags: TagName[],
): Promise<void> {
  const names = tags.map((t) => t.normalizedName);
  const existing = await tx.tag.findMany({
    where: { userId, normalizedName: { in: names } },
    select: { normalizedName: true },
  });
  const missing = tags.length - existing.length;
  if (missing > 0) {
    const total = await tx.tag.count({ where: { userId } });
    if (total + missing > MAX_TAGS_PER_USER) throw new TagLimitExceededError();
    await tx.tag.createMany({
      data: tags.map((t) => ({ userId, ...t })),
      skipDuplicates: true,
    });
  }
  const ids = await tx.tag.findMany({
    where: { userId, normalizedName: { in: names } },
    select: { id: true },
  });
  await tx.bookmarkTag.createMany({
    data: ids.map((t) => ({ bookmarkId, tagId: t.id })),
    skipDuplicates: true,
  });
}
