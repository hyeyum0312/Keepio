import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { type AuthUser, UserGuard } from "../auth/user.guard.js";
import { ApiErrorResponse } from "../common/api-error.js";
import { CategoriesService } from "./categories.service.js";
import type { CategoryRecord } from "./categories.repository.js";
import {
  CategoryConflictErrorResponse,
  CategoryListResponse,
  CategoryResponse,
} from "./dto/category-response.dto.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";

@Controller("api/categories")
@UseGuards(UserGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorResponse })
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOkResponse({ type: CategoryListResponse })
  async list(@CurrentUser() user: AuthUser): Promise<CategoryListResponse> {
    const items = await this.categories.list(user.id);
    return { items: items.map(toResponse) };
  }

  @Post()
  @ApiCreatedResponse({ type: CategoryResponse })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({
    type: CategoryConflictErrorResponse,
    description: "같은 이름이 이미 있다. 기존 카테고리 ID를 함께 준다",
  })
  @ApiUnprocessableEntityResponse({ type: ApiErrorResponse })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return toResponse(await this.categories.create(user.id, dto.name));
  }

  // AC-15 고정·해제. 이름 변경(AC-02)은 다음 범위에서 같은 경로에 더한다
  @Patch(":id")
  @ApiOkResponse({ type: CategoryResponse })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  @ApiUnprocessableEntityResponse({ type: ApiErrorResponse })
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    if (dto.pinned === undefined) {
      return toResponse(await this.categories.requireOwned(user.id, id));
    }
    return toResponse(await this.categories.setPinned(user.id, id, dto.pinned));
  }
}

function toResponse(record: CategoryRecord): CategoryResponse {
  return {
    id: record.id,
    name: record.name,
    bookmarkCount: record.bookmarkCount,
    pinned: !!record.pinnedAt,
  };
}
