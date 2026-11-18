import {
  HttpStatus,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import { loadEnv } from "../config/env.js";
import { BookmarksRepository } from "./bookmarks.repository.js";
import { sniffImageType } from "./lib/image-type.js";
import { parseOpenGraph } from "./lib/open-graph.js";
import { isUuid } from "./lib/cursor.js";
import { signThumbnailPath, thumbnailUrlKey } from "./lib/signed-url.js";
import { LinkPreviewFetcher, MAX_IMAGE_BYTES } from "./link-preview.fetcher.js";
import { ThumbnailStorage } from "./thumbnail.storage.js";

const logger = new Logger("Thumbnail");

// 큐 도입 전 임시(FEAT-010 영향도). 프로세스 안에서 동시 4개, 대기 200개까지. 넘치면 바로 실패 처리
const MAX_RUNNING = 4;
const MAX_WAITING = 200;
const STALE_PENDING_MS = 10 * 60 * 1000;

// docs/features/bookmark-meta.md 오류 표
const UNSUPPORTED_IMAGE_MESSAGE = "JPG·PNG·WEBP·GIF 이미지만 올릴 수 있어요.";
const IMAGE_TOO_LARGE_MESSAGE = "이미지는 10MB까지 올릴 수 있어요.";
const NOT_FOUND_MESSAGE = "링크를 찾을 수 없어요.";

type Job = { bookmarkId: string; url: string };

@Injectable()
export class BookmarkThumbnailsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly waiting: Job[] = [];
  private readonly running = new Set<Promise<void>>();
  private signKey?: Buffer;

  constructor(
    private readonly bookmarks: BookmarksRepository,
    private readonly fetcher: LinkPreviewFetcher,
    private readonly storage: ThumbnailStorage,
  ) {}

  private closed = false;

  // 정리 실패가 앱 시작을 막지 않게 한다(다음 시작 때 다시 시도)
  async onModuleInit() {
    try {
      const count = await this.bookmarks.failStalePending(
        new Date(Date.now() - STALE_PENDING_MS),
      );
      if (count > 0) {
        logger.warn(`stale pending thumbnails marked failed count=${count}`);
      }
    } catch (error) {
      logger.warn(`stale pending cleanup skipped: ${String(error)}`);
    }
  }

  // 종료 시 대기 작업은 버리고(다음 시작 때 failed로 정리) 실행 중인 것만 끝낸다
  async onModuleDestroy() {
    this.closed = true;
    this.waiting.length = 0;
    await this.drain();
  }

  // 응답 뒤에 실행된다. 저장 요청은 기다리지 않는다(AC-04)
  enqueue(bookmarkId: string, url: string): void {
    if (this.closed) return;
    if (this.waiting.length >= MAX_WAITING) {
      void this.bookmarks.failPendingThumbnail(bookmarkId);
      logger.warn(`queue full bookmark=${bookmarkId}`);
      return;
    }
    this.waiting.push({ bookmarkId, url });
    this.pump();
  }

  // 테스트용: 대기·실행 중인 작업이 모두 끝날 때까지
  async drain(): Promise<void> {
    while (this.running.size > 0) await Promise.all([...this.running]);
  }

  private pump() {
    while (this.running.size < MAX_RUNNING && this.waiting.length > 0) {
      const job = this.waiting.shift()!;
      const task = this.run(job).finally(() => {
        this.running.delete(task);
        this.pump();
      });
      this.running.add(task);
    }
  }

  // 실패 이유는 로그로만(URL은 민감 쿼리가 있을 수 있어 남기지 않는다, BACKEND.md)
  private async run({ bookmarkId, url }: Job): Promise<void> {
    try {
      const page = await this.fetcher.fetchPage(url);
      const og = parseOpenGraph(page.html, page.finalUrl);
      if (og.title) await this.bookmarks.setPageTitle(bookmarkId, og.title);
      if (!og.image) return await this.fail(bookmarkId, "no og:image");

      const bytes = await this.fetcher.fetchImage(og.image);
      const type = sniffImageType(bytes);
      if (!type) return await this.fail(bookmarkId, "not an image");
      const key = await this.storage.save(bytes, type);
      // 그사이 사용자가 직접 올렸으면 반영하지 않고 받은 파일을 지운다(AC-06)
      if (!(await this.bookmarks.setAutoThumbnail(bookmarkId, key))) {
        await this.storage.remove(key);
      }
    } catch (error) {
      await this.fail(
        bookmarkId,
        error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
      );
    }
  }

  private async fail(bookmarkId: string, reason: string) {
    logger.warn(`thumbnail failed bookmark=${bookmarkId} reason=${reason}`);
    await this.bookmarks
      .failPendingThumbnail(bookmarkId)
      .catch(() => undefined);
  }

  // FEAT-010 AC-06·09
  async upload(
    userId: string,
    bookmarkId: string,
    file: { buffer: Buffer; size: number } | undefined,
  ): Promise<void> {
    if (!isUuid(bookmarkId)) throw notFound();
    if (!file || file.size === 0) throw unsupportedImage();
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        "IMAGE_TOO_LARGE",
        IMAGE_TOO_LARGE_MESSAGE,
      );
    }
    const type = sniffImageType(file.buffer);
    if (!type) throw unsupportedImage();
    const key = await this.storage.save(file.buffer, type);
    const result = await this.bookmarks.setUploadedThumbnail(
      userId,
      bookmarkId,
      key,
    );
    if (!result) {
      await this.storage.remove(key);
      throw notFound();
    }
    await this.storage.remove(result.previousKey);
  }

  // 응답에 넣는 썸네일 주소(서명, 10~20분 유효). 파일이 없으면 null
  publicPath(key: string | null): string | null {
    if (!key) return null;
    this.signKey ??= thumbnailUrlKey(loadEnv().jwtSecret);
    return signThumbnailPath(this.signKey, key, Date.now());
  }

  verifyKey(): Buffer {
    this.signKey ??= thumbnailUrlKey(loadEnv().jwtSecret);
    return this.signKey;
  }
}

function unsupportedImage() {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    "UNSUPPORTED_IMAGE",
    UNSUPPORTED_IMAGE_MESSAGE,
  );
}

function notFound() {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    "BOOKMARK_NOT_FOUND",
    NOT_FOUND_MESSAGE,
  );
}
