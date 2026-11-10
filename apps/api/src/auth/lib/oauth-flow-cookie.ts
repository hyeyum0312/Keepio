import { createHmac, timingSafeEqual } from "node:crypto";
import type { OAuthProviderName } from "../../config/env.js";

// FEAT-004 AC-01·AC-03. 소셜 로그인 시작~콜백 사이에 state·nonce·PKCE verifier를 브라우저에 맡긴다.
// HttpOnly라 스크립트가 읽지 못하고, HMAC 서명이라 바꾸면 거부된다. DB에 저장하지 않는다(행·정리 비용 없음)
export const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000;

export type OAuthFlow = {
  provider: OAuthProviderName;
  state: string;
  nonce: string;
  codeVerifier: string;
  expiresAt: number;
};

// JWT 서명 키와 용도를 분리한다(같은 비밀값에서 파생, 다른 용도의 서명과 섞이지 않게)
export function flowCookieKey(jwtSecret: string): Buffer {
  return createHmac("sha256", jwtSecret)
    .update("keepio:oauth-flow-cookie:v1")
    .digest();
}

export function sealFlow(flow: OAuthFlow, key: Buffer): string {
  const body = Buffer.from(JSON.stringify(flow)).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

// 서명·형식·제공자·만료 중 하나라도 맞지 않으면 null(이유는 호출한 쪽이 로그로만 남긴다)
export function openFlow(
  value: string | undefined,
  key: Buffer,
  provider: OAuthProviderName,
  now: number,
): OAuthFlow | null {
  if (!value) return null;
  const [body, signature, extra] = value.split(".");
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(body, key));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  let flow: Partial<OAuthFlow>;
  try {
    flow = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as Partial<OAuthFlow>;
  } catch {
    return null;
  }
  if (
    flow.provider !== provider ||
    typeof flow.state !== "string" ||
    typeof flow.nonce !== "string" ||
    typeof flow.codeVerifier !== "string" ||
    typeof flow.expiresAt !== "number" ||
    flow.expiresAt <= now
  ) {
    return null;
  }
  return flow as OAuthFlow;
}

function sign(body: string, key: Buffer) {
  return createHmac("sha256", key).update(body).digest("base64url");
}
