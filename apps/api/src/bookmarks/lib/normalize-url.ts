// URL 정규화(FEAT-001 AC-05·AC-06, spec 04 URL 정책).
// 스킴·호스트 소문자, 기본 포트 제거, 한글 등 인코딩은 표준 URL 파서(WHATWG)에 맡긴다.

// B-tree 인덱스 항목 한계(약 2.7KB)보다 작게. DB CHECK 제약과 같은 값
export const MAX_URL_LENGTH = 2048;

// 목록을 바꾸면 기존 저장분과 정규화 결과가 달라진다(spec 04). 이름 정확히 일치만 제거.
// 2026-11-21 추가(사용자 결정, FEAT-010 AC-16): utm_id, NaPm(네이버 광고·쇼핑 경로), gbraid·wbraid(구글 광고), msclkid(빙 광고)
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "igshid",
  "NaPm",
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

  if (isSmartstoreProduct(url)) {
    url.hostname = SMARTSTORE_HOST;
    url.search = "";
  } else if (isCoupangProduct(url)) {
    url.hostname = COUPANG_HOST;
    url.search = keepOnly(url.search, COUPANG_KEEP);
  } else {
    url.search = isInstagramPost(url) ? "" : stripTrackingParams(url.search);
  }
  // 한글 경로·국제화 도메인은 인코딩되며 길어진다. 인덱스에 들어가는 값도 상한 안이어야 한다
  if (url.href.length > MAX_URL_LENGTH) {
    return { ok: false, error: "URL_TOO_LONG" };
  }
  return { ok: true, normalizedUrl: url.href };
}

// FEAT-010 AC-08. 인스타 게시물·릴스 주소의 쿼리(img_index, jplx, igsh 등)는 공유 경로 표시일 뿐이다.
// 같은 게시물을 다른 장으로 공유해도 하나로 묶는다
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const INSTAGRAM_POST_PATH = /^\/(p|reel|reels|tv)\/[^/]+\/?$/;

function isInstagramPost(url: URL): boolean {
  return (
    INSTAGRAM_HOSTS.has(url.hostname) && INSTAGRAM_POST_PATH.test(url.pathname)
  );
}

// FEAT-010 AC-16. 스마트스토어 상품 주소(/{가게}/products/{번호})의 쿼리는 광고·검색 경로 표시뿐이다.
// 모바일(m.) 주소도 PC 주소로 맞춰, 같은 상품을 어디서 저장해도 하나로 묶는다
const SMARTSTORE_HOST = "smartstore.naver.com";
const SMARTSTORE_HOSTS = new Set([SMARTSTORE_HOST, "m.smartstore.naver.com"]);
const SMARTSTORE_PRODUCT_PATH = /^\/[^/]+\/products\/\d+\/?$/;

function isSmartstoreProduct(url: URL): boolean {
  return (
    SMARTSTORE_HOSTS.has(url.hostname) &&
    SMARTSTORE_PRODUCT_PATH.test(url.pathname)
  );
}

// FEAT-010 AC-20. 쿠팡 상품 주소(/vp/products/{번호})는 옵션을 가리키는 itemId·vendorItemId만 남긴다.
// 나머지(src·spec·addtag·ctag·lptag·itime·wPcid·mcid·sharesource 등)는 공유·광고 경로 표시라 같은 상품도 매번 달라진다.
// m.coupang.com도 www로 맞춘다
const COUPANG_HOST = "www.coupang.com";
const COUPANG_HOSTS = new Set([COUPANG_HOST, "coupang.com", "m.coupang.com"]);
const COUPANG_PRODUCT = /^\/vp\/products\/\d+\/?$/;
const COUPANG_KEEP = ["itemId", "vendorItemId"];

function isCoupangProduct(url: URL): boolean {
  return COUPANG_HOSTS.has(url.hostname) && COUPANG_PRODUCT.test(url.pathname);
}

// 남길 이름만, 정한 순서대로(원문 값 그대로)
function keepOnly(search: string, names: string[]): string {
  const pairs = search ? search.slice(1).split("&") : [];
  const kept = names.flatMap((name) => {
    const pair = pairs.find((p) => p.split("=", 1)[0] === name);
    return pair ? [pair] : [];
  });
  return kept.length > 0 ? `?${kept.join("&")}` : "";
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
