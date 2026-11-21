import { Injectable } from "@nestjs/common";
import { loadEnv } from "../config/env.js";
import { safeFetch, SafeFetchError } from "./lib/safe-fetch.js";

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
  // finalUrl: 리다이렉트를 따라간 마지막 주소(FEAT-010 AC-19). 막힌 페이지라도 어디로 가는 링크인지는 남긴다
  constructor(
    readonly status: number,
    readonly finalUrl?: string,
  ) {
    super(`http ${status}`);
    this.name = "LinkPreviewHttpError";
  }
}

// AC-14. 다시 시도하면 될 수 있는 실패만 true: 시간 초과, 연결 끊김·일시적 DNS 실패, 서버 쪽 5xx·429.
// 차단(403)·없음(404)·주소 거부·크기 초과는 다시 해도 같으므로 false
const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ECONNABORTED",
]);

export function isTransientFetchError(error: unknown): boolean {
  if (error instanceof LinkPreviewHttpError) {
    return error.status === 429 || error.status >= 500;
  }
  if (error instanceof SafeFetchError) return error.reason === "timeout";
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" && TRANSIENT_NETWORK_CODES.has(code);
}

@Injectable()
export class SafeLinkPreviewFetcher extends LinkPreviewFetcher {
  private userAgent() {
    return loadEnv().linkPreviewUserAgent;
  }

  async fetchPage(url: string) {
    const res = await safeFetch(url, {
      maxBytes: MAX_PAGE_BYTES,
      // 큰 페이지도 대표 이미지·제목은 앞부분(<head>)에 있다. 넘는 부분만 버린다(AC-13)
      overLimit: "truncate",
      timeoutMs: TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      userAgent: this.userAgent(),
      purpose: "document",
    });
    if (res.status !== 200) {
      throw new LinkPreviewHttpError(res.status, res.finalUrl);
    }
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
      purpose: "image",
    });
    if (res.status !== 200) throw new LinkPreviewHttpError(res.status);
    return res.body;
  }
}
