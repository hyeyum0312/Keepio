import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CategoryName } from "./lib/normalize-category-name.js";
import { compareCategories } from "./lib/sort-categories.js";

export type CategoryRecord = {
  id: string;
  name: string;
  normalizedName: string;
  bookmarkCount: number;
  // FEAT-008 AC-15. 고정한 시각(null = 고정 안 함). 고정한 순서를 이 값으로 정렬한다
  pinnedAt: Date | null;
};

const RECORD_SELECT = {
  id: true,
  name: true,
  normalizedName: true,
  pinnedAt: true,
  // 활성 링크만 센다(휴지통 제외, AC-01)
  _count: { select: { bookmarks: { where: { deletedAt: null } } } },
} as const satisfies Prisma.CategorySelect;

type Row = Prisma.CategoryGetPayload<{ select: typeof RECORD_SELECT }>;

function toRecord(row: Row): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalizedName,
    bookmarkCount: row._count.bookmarks,
    pinnedAt: row.pinnedAt,
  };
}

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CategoryRecord[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId },
      select: RECORD_SELECT,
    });
    // 정렬은 서버가 정한다(AC-14·15): 고정 먼저 → 한글·영문·숫자·그 밖 → 이름순
    return rows.map(toRecord).sort(compareCategories);
  }

  // 내 링크 칩 줄의 "전체"·"미분류" 수(CAT-01). 활성 링크만. (user_id, category_id) 부분 인덱스로 센다
  async countLinks(
    userId: string,
  ): Promise<{ totalCount: number; uncategorizedCount: number }> {
    const [totalCount, uncategorizedCount] = await Promise.all([
      this.prisma.bookmark.count({ where: { userId, deletedAt: null } }),
      this.prisma.bookmark.count({
        where: { userId, deletedAt: null, categoryId: null },
      }),
    ]);
    return { totalCount, uncategorizedCount };
  }

  // AC-04. 링크는 FK ON DELETE SET NULL로 미분류가 된다(휴지통 링크 포함). 본인 것만, 지웠으면 true
  async remove(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.category.deleteMany({
      where: { id, userId },
    });
    return count === 1;
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.category.count({ where: { userId } });
  }

  // 같은 이름이면 UNIQUE(user_id, normalized_name)가 거부한다(P2002). 서비스가 기존 행을 찾아 409로 바꾼다(AC-02·08)
  async create(userId: string, input: CategoryName): Promise<CategoryRecord> {
    const row = await this.prisma.category.create({
      data: { userId, name: input.name, normalizedName: input.normalizedName },
      select: RECORD_SELECT,
    });
    return toRecord(row);
  }

  // 소유자 조건을 항상 함께 건다(다른 사용자의 ID는 없는 것과 같다, AC-07)
  async findOwnedByNormalizedName(
    userId: string,
    normalizedName: string,
  ): Promise<CategoryRecord | null> {
    const row = await this.prisma.category.findFirst({
      where: { userId, normalizedName },
      select: RECORD_SELECT,
    });
    return row ? toRecord(row) : null;
  }

  // AC-15. 본인 카테고리만. 같은 상태를 다시 보내도 성공한다(멱등)
  async setPinned(
    userId: string,
    id: string,
    pinned: boolean,
  ): Promise<CategoryRecord | null> {
    const { count } = await this.prisma.category.updateMany({
      where: { id, userId },
      data: { pinnedAt: pinned ? new Date() : null },
    });
    return count === 1 ? this.findOwned(userId, id) : null;
  }

  async countPinned(userId: string): Promise<number> {
    return this.prisma.category.count({
      where: { userId, pinnedAt: { not: null } },
    });
  }

  async findOwned(userId: string, id: string): Promise<CategoryRecord | null> {
    const row = await this.prisma.category.findFirst({
      where: { id, userId },
      select: RECORD_SELECT,
    });
    return row ? toRecord(row) : null;
  }
}
