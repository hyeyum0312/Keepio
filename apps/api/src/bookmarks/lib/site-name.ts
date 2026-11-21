// FEAT-010 AC-17·18. 제목도 페이지 제목도 없을 때 보여 줄 사이트 이름.
// 네이버 스마트스토어·브랜드스토어는 주소의 첫 경로가 가게(브랜드) 이름이라 "diaday · 스마트스토어"처럼 보여 준다.
// 쿠팡은 주소에 상품 번호뿐이라 "쿠팡 상품"(상품 주소) 또는 "쿠팡"(짧은 주소 등)으로 보여 준다(AC-20).
// 그 밖에는 도메인에서 앞의 www.·m.을 뺀다. 주소로 알 수 있는 것만 쓰고 페이지는 다시 받지 않는다
const STORES: Record<string, string> = {
  "smartstore.naver.com": "스마트스토어",
  "m.smartstore.naver.com": "스마트스토어",
  "brand.naver.com": "브랜드스토어",
  "m.brand.naver.com": "브랜드스토어",
};
// 가게 이름이 아닌 첫 경로(목록·검색 화면 등)
const NOT_STORE = new Set([
  "main",
  "search",
  "category",
  "best",
  "inflow",
  "my",
]);
const STORE_SLUG = /^[A-Za-z0-9_-]{1,50}$/;
const COUPANG_HOST = /^(?:(?:www|m|link)\.)?coupang\.com$/;
const COUPANG_PRODUCT_PATH = /^\/vp\/products\/\d+\/?$/;

export function siteName(url: string): string | null {
  const parsed = URL.parse(url);
  if (!parsed) return null;
  const host = parsed.hostname;
  if (COUPANG_HOST.test(host)) {
    return COUPANG_PRODUCT_PATH.test(parsed.pathname) ? "쿠팡 상품" : "쿠팡";
  }
  const store = STORES[host];
  if (store) {
    const slug = parsed.pathname.split("/")[1] ?? "";
    if (STORE_SLUG.test(slug) && !NOT_STORE.has(slug.toLowerCase())) {
      return `${slug} · ${store}`;
    }
  }
  return host ? host.replace(/^(www|m)\./, "") : null;
}
