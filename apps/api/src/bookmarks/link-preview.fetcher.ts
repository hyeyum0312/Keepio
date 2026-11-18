import { Injectable } from "@nestjs/common";
import { loadEnv } from "../config/env.js";
import { safeFetch } from "./lib/safe-fetch.js";

// FEAT-010 AC-04·10. 링크 페이지와 대표 이미지를 받아 온다. 테스트는 이 provider를 가짜로 바꾼다
export abstract class LinkPreviewFetcher {
  abstract fetchPage(url: string): Promise<{ html: string; finalUrl: string }>;
  abstract fetchImage(url: string): Promise<Buffer>;
}

export const MAX_PAGE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

export class LinkPreviewHttpError extends Error {
  constructor(readonly status: number) {
    super(`http ${status}`);
    this.name = "LinkPreviewHttpError";
  }
}

@Injectable()
export class SafeLinkPreviewFetcher extends LinkPreviewFetcher {
  private userAgent() {
    return loadEnv().linkPreviewUserAgent;
  }

  async fetchPage(url: string) {
    const res = await safeFetch(url, {
      maxBytes: MAX_PAGE_BYTES,
      timeoutMs: TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      userAgent: this.userAgent(),
    });
    if (res.status !== 200) throw new LinkPreviewHttpError(res.status);
    // 대부분 UTF-8. 다른 인코딩은 og 값이 깨질 수 있으나 썸네일 주소(ASCII)는 읽힌다
    return { html: res.body.toString("utf8"), finalUrl: res.finalUrl };
  }

  async fetchImage(url: string) {
    const res = await safeFetch(url, {
      maxBytes: MAX_IMAGE_BYTES,
      timeoutMs: TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.1",
      userAgent: this.userAgent(),
    });
    if (res.status !== 200) throw new LinkPreviewHttpError(res.status);
    return res.body;
  }
}
