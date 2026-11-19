import { Controller, Get, HttpStatus, Param, Query, Res } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiQuery,
} from "@nestjs/swagger";
import type { Response } from "express";
import { ApiErrorResponse, ApiException } from "../common/api-error.js";
import { BookmarkThumbnailsService } from "./bookmark-thumbnails.service.js";
import { verifyThumbnailSignature } from "./lib/signed-url.js";
import { ThumbnailStorage } from "./thumbnail.storage.js";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

// FEAT-010 AC-09. <img>가 부르는 주소라 인증 헤더 대신 서명으로 권한을 확인한다
@Controller("api/files")
export class BookmarkFilesController {
  constructor(
    private readonly thumbnails: BookmarkThumbnailsService,
    private readonly storage: ThumbnailStorage,
  ) {}

  @Get("thumbnails/:key")
  @ApiProduces("image/jpeg", "image/png", "image/gif", "image/webp")
  @ApiQuery({ name: "exp", required: true })
  @ApiQuery({ name: "sig", required: true })
  @ApiOkResponse({ description: "썸네일 이미지" })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  thumbnail(
    @Param("key") key: string,
    @Query("exp") exp: string | undefined,
    @Query("sig") sig: string | undefined,
    @Res() res: Response,
  ): void {
    if (
      !verifyThumbnailSignature(
        this.thumbnails.verifyKey(),
        key,
        exp,
        sig,
        Date.now(),
      )
    ) {
      throw notFound();
    }
    res.setHeader("content-type", MIME[key.split(".").at(-1)!]);
    // 서명 주소가 바뀌면 새로 받는다. 공유 캐시에는 두지 않는다
    res.setHeader("cache-control", "private, max-age=600");
    res.setHeader("x-content-type-options", "nosniff");
    // 저장 폴더 기본값이 `.storage`라 경로에 점으로 시작하는 폴더가 있다. 기본값(dotfiles: ignore)이면 404가 난다.
    // key는 서명으로 확인한 값이고 파일명 형식은 저장소가 정한다
    res.sendFile(this.storage.filePath(key), { dotfiles: "allow" }, (err) => {
      if (err && !res.headersSent) {
        res.status(HttpStatus.NOT_FOUND).end();
      }
    });
  }
}

function notFound() {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    "NOT_FOUND",
    "요청한 주소를 찾을 수 없어요.",
  );
}
