import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { type AuthUser, UserGuard } from "../auth/user.guard.js";
import { ApiErrorResponse } from "../common/api-error.js";
import type { BookmarkRecord } from "./bookmarks.repository.js";
import { BookmarksService } from "./bookmarks.service.js";
import {
  BookmarkConflictErrorResponse,
  BookmarkListResponse,
  BookmarkResponse,
} from "./dto/bookmark-response.dto.js";
import { ListBookmarksQuery } from "./dto/list-bookmarks.dto.js";
import { SaveBookmarkDto } from "./dto/save-bookmark.dto.js";

@Controller("api/bookmarks")
@UseGuards(UserGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorResponse })
export class BookmarksController {
  constructor(private readonly bookmarks: BookmarksService) {}

  @Post()
  @ApiCreatedResponse({ type: BookmarkResponse, description: "새로 저장" })
  @ApiOkResponse({ type: BookmarkResponse, description: "이미 저장된 링크" })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({ type: BookmarkConflictErrorResponse })
  // 신규/기존은 상태 코드로만 구분한다(FEAT-001)
  async save(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveBookmarkDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BookmarkResponse> {
    const { bookmark, created } = await this.bookmarks.save(user.id, dto.url);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return toResponse(bookmark);
  }

  // FEAT-002 AC-01~03. status=deleted면 휴지통
  @Get()
  @ApiOkResponse({ type: BookmarkListResponse })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListBookmarksQuery,
  ): Promise<BookmarkListResponse> {
    const page = await this.bookmarks.list(
      user.id,
      query.status,
      query.limit,
      query.cursor,
    );
    return { items: page.items.map(toResponse), nextCursor: page.nextCursor };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "이미 삭제됐어도 204" })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.bookmarks.remove(user.id, id);
  }

  @Post(":id/restore")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BookmarkResponse, description: "이미 활성이어도 200" })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({ type: BookmarkConflictErrorResponse })
  async restore(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<BookmarkResponse> {
    return toResponse(await this.bookmarks.restore(user.id, id));
  }
}

function toResponse(bookmark: BookmarkRecord): BookmarkResponse {
  return {
    id: bookmark.id,
    url: bookmark.originalUrl,
    normalizedUrl: bookmark.normalizedUrl,
    createdAt: bookmark.createdAt.toISOString(),
    deletedAt: bookmark.deletedAt?.toISOString() ?? null,
  };
}
