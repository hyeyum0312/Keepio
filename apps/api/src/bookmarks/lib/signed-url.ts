import { createHmac, timingSafeEqual } from "node:crypto";

// FEAT-010 AC-09. <img>는 인증 헤더를 못 보내므로 짧게 만료되는 서명 주소로 썸네일을 준다.
// 키는 JWT_SECRET에서 용도별로 파생한다(같은 비밀값을 다른 용도 서명에 그대로 쓰지 않는다)
export const THUMBNAIL_URL_TTL_SECONDS = 10 * 60;
const KEY_PATTERN = /^[a-f0-9]{32}\.(jpg|png|gif|webp)$/;

export function thumbnailUrlKey(jwtSecret: string): Buffer {
  return createHmac("sha256", jwtSecret)
    .update("keepio:thumbnail-url:v1")
    .digest();
}

export function isThumbnailKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

function signature(key: Buffer, fileKey: string, exp: number): string {
  return createHmac("sha256", key)
    .update(`${fileKey}.${exp}`)
    .digest("base64url");
}

// 같은 10분 구간 안에서는 같은 주소가 나와 브라우저 캐시가 동작한다
export function signThumbnailPath(
  key: Buffer,
  fileKey: string,
  nowMs: number,
): string {
  const window = THUMBNAIL_URL_TTL_SECONDS;
  const exp = (Math.floor(nowMs / 1000 / window) + 2) * window;
  return `/api/files/thumbnails/${fileKey}?exp=${exp}&sig=${signature(key, fileKey, exp)}`;
}

export function verifyThumbnailSignature(
  key: Buffer,
  fileKey: string,
  exp: string | undefined,
  sig: string | undefined,
  nowMs: number,
): boolean {
  if (!isThumbnailKey(fileKey) || !exp || !sig || !/^\d{1,12}$/.test(exp)) {
    return false;
  }
  const expSeconds = Number(exp);
  if (expSeconds * 1000 < nowMs) return false;
  const expected = Buffer.from(signature(key, fileKey, expSeconds));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
