import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
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
  BookmarkDeletedErrorResponse,
  BookmarkResponse,
} from "./dto/bookmark-response.dto.js";
import { SaveBookmarkDto } from "./dto/save-bookmark.dto.js";

@Controller("api/bookmarks")
@UseGuards(UserGuard)
@ApiUnauthorizedResponse({ type: ApiErrorResponse })
export class BookmarksController {
  constructor(private readonly bookmarks: BookmarksService) {}

  @Post()
  @ApiCreatedResponse({ type: BookmarkResponse, description: "새로 저장" })
  @ApiOkResponse({ type: BookmarkResponse, description: "이미 저장된 링크" })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({ type: BookmarkDeletedErrorResponse })
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
}

function toResponse(bookmark: BookmarkRecord): BookmarkResponse {
  return {
    id: bookmark.id,
    url: bookmark.originalUrl,
    normalizedUrl: bookmark.normalizedUrl,
    createdAt: bookmark.createdAt.toISOString(),
  };
}
