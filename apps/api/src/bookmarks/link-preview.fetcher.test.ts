import { describe, expect, it } from "vitest";
import { SafeFetchError } from "./lib/safe-fetch.js";
import {
  isTransientFetchError,
  LinkPreviewHttpError,
} from "./link-preview.fetcher.js";

function networkError(code: string) {
  return Object.assign(new Error(code), { code });
}

describe("isTransientFetchError (FEAT-010 AC-14)", () => {
  it("AC-14: 시간 초과·연결 끊김·5xx·429는 다시 시도한다", () => {
    for (const error of [
      new SafeFetchError("timeout"),
      networkError("ECONNRESET"),
      networkError("EAI_AGAIN"),
      new LinkPreviewHttpError(503),
      new LinkPreviewHttpError(500),
      new LinkPreviewHttpError(429),
    ]) {
      expect(isTransientFetchError(error), error.message).toBe(true);
    }
  });

  it("AC-14: 차단·없음·주소 거부·크기 초과·알 수 없는 오류는 다시 시도하지 않는다", () => {
    for (const error of [
      new LinkPreviewHttpError(403),
      new LinkPreviewHttpError(404),
      new SafeFetchError("blocked address"),
      new SafeFetchError("too large"),
      new SafeFetchError("too many redirects"),
      networkError("ENOTFOUND"),
      new Error("offline"),
    ]) {
      expect(isTransientFetchError(error), error.message).toBe(false);
    }
    expect(isTransientFetchError(null)).toBe(false);
  });
});
