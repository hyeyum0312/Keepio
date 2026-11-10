import { HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerGuard, type ThrottlerOptions } from "@nestjs/throttler";
import { ApiException } from "../common/api-error.js";
import { normalizeEmail } from "./lib/email.js";

// FEAT-003 AC-16·Q-4. 메모리 저장(단일 인스턴스 전제, 재시작 시 초기화). 여러 대로 늘리면 Redis 저장소로 바꾼다.
// IP는 req.ip(앞단 프록시 수는 TRUST_PROXY_HOPS). 모든 제한이 기본 적용되고, 라우트에서 해당 없는 것을 SkipThrottle로 끈다
export const THROTTLE_IP = "ip";
export const THROTTLE_LOGIN_EMAIL = "loginEmail";
export const THROTTLE_MAIL_EMAIL = "mailEmail";

const MINUTE = 60_000;

// 본문의 이메일(정규화)을 키로 쓴다. 형식이 틀린 값도 같은 값끼리는 함께 센다
export function emailTracker(req: Record<string, unknown>): string {
  const body = req.body as { email?: unknown } | undefined;
  const raw = typeof body?.email === "string" ? body.email : "";
  const normalized = normalizeEmail(raw);
  return normalized.ok
    ? normalized.email
    : `invalid:${raw.trim().toLowerCase().slice(0, 254)}`;
}

export const AUTH_THROTTLERS: ThrottlerOptions[] = [
  { name: THROTTLE_IP, ttl: MINUTE, limit: 10 },
  {
    name: THROTTLE_LOGIN_EMAIL,
    ttl: 15 * MINUTE,
    limit: 5,
    getTracker: emailTracker,
  },
  {
    // 가입·재발송·재설정 메일을 합쳐 센다(라우트별로 따로 세면 3배까지 보낼 수 있다)
    name: THROTTLE_MAIL_EMAIL,
    ttl: 60 * MINUTE,
    limit: 3,
    getTracker: emailTracker,
    generateKey: (_context, tracker, name) => `${name}:${tracker}`,
  },
];

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  // 기본 예외(영어 메시지) 대신 공통 오류 형태와 사용자 문구로(ADR-009)
  protected override throwThrottlingException(): Promise<void> {
    throw new ApiException(
      HttpStatus.TOO_MANY_REQUESTS,
      "TOO_MANY_ATTEMPTS",
      "시도가 너무 많아요. 잠시 후 다시 시도해 주세요.",
    );
  }
}
