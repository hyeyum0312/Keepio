import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import { Prisma } from "../generated/prisma/client.js";
import { isUuid } from "../bookmarks/lib/cursor.js";
import {
  type CategoryRecord,
  CategoriesRepository,
} from "./categories.repository.js";
import {
  MAX_CATEGORIES_PER_USER,
  MAX_PINNED_CATEGORIES,
  toCategoryName,
} from "./lib/normalize-category-name.js";

const NAME_INVALID_MESSAGE = "카테고리 이름은 1~20자로 입력해 주세요.";
const DUPLICATE_MESSAGE = "이미 같은 이름의 카테고리가 있어요.";
const LIMIT_MESSAGE = "카테고리는 100개까지 만들 수 있어요.";
const NOT_FOUND_MESSAGE = "카테고리를 찾을 수 없어요.";
const PIN_LIMIT_MESSAGE = "고정은 8개까지 할 수 있어요.";

export function categoryNotFound(): ApiException {
  return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", NOT_FOUND_MESSAGE);
}

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  async list(userId: string): Promise<{
    items: CategoryRecord[];
    totalCount: number;
    uncategorizedCount: number;
  }> {
    const [items, counts] = await Promise.all([
      this.categories.list(userId),
      this.categories.countLinks(userId),
    ]);
    return { items, ...counts };
  }

  // AC-01·02·08·12. 같은 이름이면 409와 기존 ID를 준다(화면은 오류로 보여 주지 않고 그 카테고리를 쓴다)
  async create(userId: string, input: string): Promise<CategoryRecord> {
    const name = toCategoryName(input);
    if (!name) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "VALIDATION_FAILED",
        NAME_INVALID_MESSAGE,
      );
    }
    const existing = await this.categories.findOwnedByNormalizedName(
      userId,
      name.normalizedName,
    );
    if (existing) throw duplicate(existing.id);

    if (
      (await this.categories.countForUser(userId)) >= MAX_CATEGORIES_PER_USER
    ) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "CATEGORY_LIMIT",
        LIMIT_MESSAGE,
      );
    }

    try {
      return await this.categories.create(userId, name);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // 같은 이름을 동시에 만들었다. UNIQUE가 최종 권위이고, 먼저 만들어진 행을 돌려준다(AC-08)
      const raced = await this.categories.findOwnedByNormalizedName(
        userId,
        name.normalizedName,
      );
      throw raced ? duplicate(raced.id) : (error as Error);
    }
  }

  // AC-15. 고정·해제. 같은 상태를 다시 보내도 성공한다(멱등). 고정은 8개까지
  async setPinned(
    userId: string,
    id: string,
    pinned: boolean,
  ): Promise<CategoryRecord> {
    const current = await this.requireOwned(userId, id);
    if (pinned === !!current.pinnedAt) return current;
    if (
      pinned &&
      (await this.categories.countPinned(userId)) >= MAX_PINNED_CATEGORIES
    ) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "CATEGORY_PIN_LIMIT",
        PIN_LIMIT_MESSAGE,
      );
    }
    const updated = await this.categories.setPinned(userId, id, pinned);
    if (!updated) throw categoryNotFound();
    return updated;
  }

  // AC-04·07. 링크는 남고 미분류가 된다. 없거나 남의 카테고리면 404(이미 지운 것도 404)
  async remove(userId: string, id: string): Promise<void> {
    if (!isUuid(id) || !(await this.categories.remove(userId, id))) {
      throw categoryNotFound();
    }
  }

  // 링크에 카테고리를 걸 때 쓴다. 본인 것이 아니거나 없으면 404(AC-07·09)
  async requireOwned(userId: string, id: string): Promise<CategoryRecord> {
    if (!isUuid(id)) throw categoryNotFound();
    const found = await this.categories.findOwned(userId, id);
    if (!found) throw categoryNotFound();
    return found;
  }
}

function duplicate(categoryId: string): ApiException {
  return new ApiException(
    HttpStatus.CONFLICT,
    "CATEGORY_DUPLICATE",
    DUPLICATE_MESSAGE,
    { categoryId },
  );
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
