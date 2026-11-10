import { createHash, randomBytes } from "node:crypto";

// Refresh Token·메일 토큰 공통(FEAT-003). 256비트 무작위 값이라 느린 해시가 필요 없다.
// 원문은 클라이언트에만 있고 DB에는 SHA-256(32바이트)만 저장한다
const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

// 형식이 다른 입력은 조회하지 않고 거부한다(임의 길이 입력 해시·DB 조회 방지)
export function isWellFormedToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function hashToken(token: string): Buffer {
  return createHash("sha256").update(token).digest();
}
