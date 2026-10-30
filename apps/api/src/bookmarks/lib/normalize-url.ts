// URL 정규화(FEAT-001 AC-05·AC-06, spec 04 URL 정책).
// 스킴·호스트 소문자, 기본 포트 제거, 한글 등 인코딩은 표준 URL 파서(WHATWG)에 맡긴다.

// B-tree 인덱스 항목 한계(약 2.7KB)보다 작게. DB CHECK 제약과 같은 값
export const MAX_URL_LENGTH = 2048;

// 목록을 바꾸면 기존 저장분과 정규화 결과가 달라진다(spec 04). 이름 정확히 일치만 제거
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "igshid",
]);

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export type NormalizeUrlError =
  "INVALID_URL" | "UNSUPPORTED_SCHEME" | "URL_TOO_LONG";

export type NormalizeUrlResult =
  { ok: true; normalizedUrl: string } | { ok: false; error: NormalizeUrlError };

export function normalizeUrl(input: string): NormalizeUrlResult {
  // 아주 긴 입력은 파싱하기 전에 거부한다
  if (input.length > MAX_URL_LENGTH)
    return { ok: false, error: "URL_TOO_LONG" };

  const url = URL.parse(input);
  if (!url) return { ok: false, error: "INVALID_URL" };
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, error: "UNSUPPORTED_SCHEME" };
  }

  url.search = stripTrackingParams(url.search);
  // 한글 경로·국제화 도메인은 인코딩되며 길어진다. 인덱스에 들어가는 값도 상한 안이어야 한다
  if (url.href.length > MAX_URL_LENGTH) {
    return { ok: false, error: "URL_TOO_LONG" };
  }
  return { ok: true, normalizedUrl: url.href };
}

// searchParams.delete()는 남은 파라미터까지 다시 인코딩한다(%20 → +). 원문 그대로 두려고 문자열로 거른다
function stripTrackingParams(search: string): string {
  if (!search) return "";
  const kept = search
    .slice(1)
    .split("&")
    .filter((pair) => !TRACKING_PARAMS.has(pair.split("=", 1)[0]));
  return kept.length > 0 ? `?${kept.join("&")}` : "";
}
