import { describe, expect, it } from "vitest";
import {
  signThumbnailPath,
  thumbnailUrlKey,
  verifyThumbnailSignature,
} from "./signed-url.js";

const KEY = thumbnailUrlKey("x".repeat(32));
const FILE = "0123456789abcdef0123456789abcdef.jpg";
const NOW = 1_800_000_000_000;

function parts(path: string) {
  const url = new URL(path, "http://api");
  return {
    file: url.pathname.split("/").at(-1)!,
    exp: url.searchParams.get("exp") ?? undefined,
    sig: url.searchParams.get("sig") ?? undefined,
  };
}

describe("썸네일 서명 주소 (FEAT-010 AC-09)", () => {
  it("AC-09: 만든 주소는 만료 전까지 통과한다", () => {
    const { file, exp, sig } = parts(signThumbnailPath(KEY, FILE, NOW));
    expect(verifyThumbnailSignature(KEY, file, exp, sig, NOW)).toBe(true);
    expect(
      verifyThumbnailSignature(KEY, file, exp, sig, NOW + 9 * 60_000),
    ).toBe(true);
  });

  it("AC-09: 만료·서명 변조·다른 파일·다른 키는 거부한다", () => {
    const { file, exp, sig } = parts(signThumbnailPath(KEY, FILE, NOW));
    expect(
      verifyThumbnailSignature(KEY, file, exp, sig, NOW + 31 * 60_000),
    ).toBe(false);
    expect(verifyThumbnailSignature(KEY, file, exp, `${sig}x`, NOW)).toBe(
      false,
    );
    expect(
      verifyThumbnailSignature(KEY, FILE.replace("0", "1"), exp, sig, NOW),
    ).toBe(false);
    expect(
      verifyThumbnailSignature(
        thumbnailUrlKey("y".repeat(32)),
        file,
        exp,
        sig,
        NOW,
      ),
    ).toBe(false);
  });

  it("AC-09: 파일 키 형식이 아니면(경로 이동 시도 등) 거부한다", () => {
    expect(
      verifyThumbnailSignature(KEY, "../../etc/passwd", "1", "a", NOW),
    ).toBe(false);
  });

  it("같은 10분 구간 안에서는 같은 주소를 준다(브라우저 캐시)", () => {
    expect(signThumbnailPath(KEY, FILE, NOW)).toBe(
      signThumbnailPath(KEY, FILE, NOW + 1000),
    );
  });
});
