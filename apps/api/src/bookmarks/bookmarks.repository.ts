import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

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
}
