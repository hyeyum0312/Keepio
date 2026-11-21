// FEAT-010 AC-15. 파비콘을 불러 볼 순서: 페이지가 알려 준 아이콘(서버가 고른 faviconUrl) → 사이트 주소/favicon.ico.
// 서버는 파비콘을 받지 않는다. 둘 다 못 불러오면 화면은 아이콘 없이 아트워크만 보인다
export function faviconSources(
  faviconUrl: string | null | undefined,
  pageUrl: string,
): string[] {
  const sources: string[] = [];
  if (faviconUrl) sources.push(faviconUrl);
  const page = URL.parse(pageUrl);
  if (page && (page.protocol === "http:" || page.protocol === "https:")) {
    const fallback = `${page.origin}/favicon.ico`;
    if (!sources.includes(fallback)) sources.push(fallback);
  }
  return sources;
}
