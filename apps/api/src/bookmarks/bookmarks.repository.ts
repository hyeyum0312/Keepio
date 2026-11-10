import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { Cursor } from "./lib/cursor.js";

export type BookmarkRecord = {
  id: string;
  originalUrl: string;
  normalizedUrl: string;
  createdAt: Date;
  deletedAt: Date | null;
};

const RECORD_SELECT = {
  id: true,
  originalUrl: true,
  normalizedUrl: true,
  createdAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class BookmarksRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 활성 행이 있으면 그것을, 없으면 가장 최근에 삭제된 행을 준다
  findLatestByUrl(
    userId: string,
    normalizedUrl: string,
  ): Promise<BookmarkRecord | null> {
    return this.prisma.bookmark.findFirst({
      where: { userId, normalizedUrl },
      orderBy: { deletedAt: { sort: "desc", nulls: "first" } },
      select: RECORD_SELECT,
    });
  }

  findActiveByUrl(
    userId: string,
    normalizedUrl: string,
  ): Promise<BookmarkRecord | null> {
    return this.prisma.bookmark.findFirst({
      where: { userId, normalizedUrl, deletedAt: null },
      select: RECORD_SELECT,
    });
  }

  // 활성 행과 충돌하면 아무것도 넣지 않고 null. 동시 요청의 승자는 부분 UNIQUE 인덱스가 정한다.
  // Prisma create는 충돌마다 DB 오류를 낸다(동시 100회면 99건). ON CONFLICT … WHERE는 Prisma API로 표현되지 않아 SQL로 쓴다
  async insertIfAbsent(
    userId: string,
    originalUrl: string,
    normalizedUrl: string,
  ): Promise<BookmarkRecord | null> {
    const rows = await this.prisma.$queryRaw<BookmarkRecord[]>`
      INSERT INTO bookmarks (user_id, original_url, normalized_url)
      VALUES (${userId}::uuid, ${originalUrl}, ${normalizedUrl})
      ON CONFLICT (user_id, normalized_url) WHERE deleted_at IS NULL DO NOTHING
      RETURNING id, original_url AS "originalUrl", normalized_url AS "normalizedUrl",
                created_at AS "createdAt", deleted_at AS "deletedAt"`;
    return rows[0] ?? null;
  }

  // FEAT-002 AC-01·02. limit+1개를 읽어 다음 페이지 여부를 안다. 키셋 조건: (created_at, id) < 커서
  listActive(
    userId: string,
    limit: number,
    after: Cursor | null,
  ): Promise<BookmarkRecord[]> {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(after && keyset("createdAt", after)),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: RECORD_SELECT,
    });
  }

  // FEAT-002 AC-03. 최근 삭제 순
  listDeleted(
    userId: string,
    limit: number,
    after: Cursor | null,
  ): Promise<BookmarkRecord[]> {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
        deletedAt: { not: null },
        ...(after && keyset("deletedAt", after)),
      },
      orderBy: [{ deletedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: RECORD_SELECT,
    });
  }

  // 소유자 조건을 항상 함께 건다(다른 사용자의 ID는 없는 것과 같다, AC-07)
  findOwned(userId: string, id: string): Promise<BookmarkRecord | null> {
    return this.prisma.bookmark.findFirst({
      where: { id, userId },
      select: RECORD_SELECT,
    });
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
      select: RECORD_SELECT,
    });
    return restored ?? null;
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
