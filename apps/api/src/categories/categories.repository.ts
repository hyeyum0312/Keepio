import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CategoryName } from "./lib/normalize-category-name.js";

export type CategoryRecord = {
  id: string;
  name: string;
  normalizedName: string;
  bookmarkCount: number;
};

const RECORD_SELECT = {
  id: true,
  name: true,
  normalizedName: true,
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
  };
}

// 이름순은 서버가 정한다(AC-01). DB 정렬은 collation에 따라 환경마다 달라지므로 한국어 기준으로 여기서 맞춘다
const collator = new Intl.Collator("ko");

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CategoryRecord[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId },
      select: RECORD_SELECT,
    });
    return rows.map(toRecord).sort((a, b) => collator.compare(a.name, b.name));
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

  async findOwned(userId: string, id: string): Promise<CategoryRecord | null> {
    const row = await this.prisma.category.findFirst({
      where: { id, userId },
      select: RECORD_SELECT,
    });
    return row ? toRecord(row) : null;
  }
}
