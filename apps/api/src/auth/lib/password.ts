import { randomBytes } from "node:crypto";
import argon2 from "argon2";

// FEAT-003 AC-02. 길이만 본다(NIST 800-63B: 조합 규칙 강제 대신 길이). 상한은 해시 비용 공격 방지
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// 이모지 등 서로게이트 쌍을 한 글자로 센다
export function isValidPassword(password: string): boolean {
  const length = [...password].length;
  return length >= MIN_PASSWORD_LENGTH && length <= MAX_PASSWORD_LENGTH;
}

// argon2id, OWASP Password Storage Cheat Sheet 권장 설정(m=19MiB, t=2, p=1).
// 라이브러리 기본값(64MiB)은 동시 해시 4개(libuv 스레드)에 약 256MiB라 작은 서버에서 메모리 부족 장애가 난다(2026-11-10 결정).
// 파라미터는 해시 문자열에 함께 저장되므로 나중에 올려도 기존 해시는 검증된다
export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // 손상된 해시는 불일치로 본다(예외로 500을 내지 않는다)
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

// 없는 이메일로 로그인해도 실제 검증과 같은 시간을 쓰게 한다(AC-08 응답 시간으로 가입 여부 노출 방지).
// 프로세스당 한 번만 만들고 결과는 항상 false
export async function verifyDummyPassword(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(32).toString("base64url"));
  await verifyPassword(await dummyHash, password);
  return false;
}
