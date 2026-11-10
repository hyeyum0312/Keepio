import { loadEnv } from "../config/env.js";

// 운영은 loadEnv가 WEB_ORIGIN을 필수로 검증한다. 개발·테스트에서 비어 있을 때만 쓴다(SETUP 포트)
const LOCAL_WEB_ORIGIN = "http://localhost:7710";

let cached: string | undefined;

// 메일 링크·소셜 로그인 리디렉션이 향할 웹 주소
export function webOrigin(): string {
  cached ??= (loadEnv().webOrigin ?? LOCAL_WEB_ORIGIN).replace(/\/$/, "");
  return cached;
}
