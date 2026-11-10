import { HttpStatus } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import { ApiException } from "../common/api-error.js";
import { loadEnv } from "../config/env.js";
import type { Session } from "./session.service.js";

// FEAT-003 AC-07. JS에서 읽을 수 없고(HttpOnly) 인증 경로에만 실린다
export const REFRESH_COOKIE = "keepio_refresh";
const COOKIE_PATH = "/api/auth";

const BASE: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: COOKIE_PATH,
};

export function setRefreshCookie(res: Response, session: Session) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...BASE,
    expires: session.refreshExpiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, BASE);
}

export function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === "string" ? value : undefined;
}

let webOrigin: string | null | undefined;

// 쿠키로 인증하는 요청의 CSRF 방어(SameSite=Lax와 함께). 브라우저는 다른 출처의 POST에 Origin을 붙인다.
// Origin이 없으면(브라우저가 아닌 클라이언트) 통과. WEB_ORIGIN이 없으면(개발) 검사하지 않는다. 운영은 WEB_ORIGIN 필수
export function assertTrustedOrigin(req: Request) {
  webOrigin ??= loadEnv().webOrigin ?? null;
  const origin = req.header("origin");
  if (!webOrigin || !origin || origin === webOrigin) return;
  throw new ApiException(
    HttpStatus.FORBIDDEN,
    "INVALID_ORIGIN",
    "잘못된 요청이에요.",
  );
}
