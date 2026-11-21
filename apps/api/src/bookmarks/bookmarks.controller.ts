import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiPayloadTooLargeResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { type AuthUser, UserGuard } from "../auth/user.guard.js";
import { ApiErrorResponse } from "../common/api-error.js";
import type { BookmarkRecord } from "./bookmarks.repository.js";
import { BookmarkThumbnailsService } from "./bookmark-thumbnails.service.js";
import { BookmarksService } from "./bookmarks.service.js";
import { MAX_IMAGE_BYTES } from "./link-preview.fetcher.js";
import { UploadErrorFilter } from "./upload-error.filter.js";
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
  constructor(
    private readonly bookmarks: BookmarksService,
    private readonly thumbnails: BookmarkThumbnailsService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: BookmarkResponse, description: "새로 저장" })
  @ApiOkResponse({ type: BookmarkResponse, description: "이미 저장된 링크" })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({ type: BookmarkConflictErrorResponse })
  @ApiUnprocessableEntityResponse({ type: ApiErrorResponse })
  // 신규/기존은 상태 코드로만 구분한다(FEAT-001)
  async save(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveBookmarkDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BookmarkResponse> {
    const { bookmark, created } = await this.bookmarks.save(user.id, dto);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return this.toResponse(bookmark);
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
    return {
      items: page.items.map((b) => this.toResponse(b)),
      nextCursor: page.nextCursor,
    };
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
    return this.toResponse(await this.bookmarks.restore(user.id, id));
  }

  // FEAT-010 AC-06. multipart 필드 이름 file. 형식은 바이트로 확인한다
  @Put(":id/thumbnail")
  @UseFilters(UploadErrorFilter)
  @UseInterceptors(
    FileInterceptor("file", {
      // 상한을 1바이트 넘겨 받아 두고 서비스가 IMAGE_TOO_LARGE 문구로 거부한다. 그 이상은 필터가 같은 문구로
      limits: { fileSize: MAX_IMAGE_BYTES + 1, files: 1, fields: 0, parts: 2 },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ApiOkResponse({ type: BookmarkResponse })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  @ApiPayloadTooLargeResponse({ type: ApiErrorResponse })
  async uploadThumbnail(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined,
  ): Promise<BookmarkResponse> {
    await this.thumbnails.upload(user.id, id, file);
    return this.toResponse(await this.bookmarks.get(user.id, id));
  }

  private toResponse(bookmark: BookmarkRecord): BookmarkResponse {
    return {
      id: bookmark.id,
      url: bookmark.originalUrl,
      normalizedUrl: bookmark.normalizedUrl,
      createdAt: bookmark.createdAt.toISOString(),
      deletedAt: bookmark.deletedAt?.toISOString() ?? null,
      title: bookmark.title,
      displayTitle: displayTitle(bookmark),
      tags: bookmark.tags,
      thumbnail: {
        status: bookmark.thumbnailStatus,
        url:
          bookmark.thumbnailStatus === "ready"
            ? this.thumbnails.publicPath(bookmark.thumbnailKey)
            : null,
        sourceUrl:
          bookmark.thumbnailSource === "upload"
            ? null
            : bookmark.thumbnailSourceUrl,
      },
      faviconUrl: bookmark.faviconUrl,
    };
  }
}

// FEAT-010 AC-07·17. 넣은 제목 → og:title → 사이트 이름(도메인에서 앞의 www.·m.을 뺀 것)
function displayTitle(bookmark: BookmarkRecord): string {
  const host = URL.parse(bookmark.originalUrl)?.hostname;
  return (
    bookmark.title ??
    bookmark.pageTitle ??
    (host ? host.replace(/^(www|m)\./, "") : bookmark.originalUrl)
  );
}
