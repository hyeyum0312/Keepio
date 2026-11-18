// FEAT-010 AC-04·07. 링크 페이지 HTML에서 og:image·og:title만 읽는다.
// 전체 HTML 파서를 쓰지 않는다: <meta> 태그 속성만 정규식으로 꺼내고, 값은 길이 제한·엔티티 해제 후 쓴다
export type OpenGraph = { image: string | null; title: string | null };

const META_TAG = /<meta\b[^>]*>/gi;
const ATTR = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const MAX_TITLE_LENGTH = 300;

export function parseOpenGraph(html: string, pageUrl: string): OpenGraph {
  let image: string | null = null;
  let title: string | null = null;
  for (const tag of html.match(META_TAG) ?? []) {
    const attrs = readAttrs(tag);
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    const content = attrs.content;
    if (content === undefined) continue;
    if (!image && (key === "og:image" || key === "og:image:url")) {
      image = absoluteHttpUrl(decodeEntities(content), pageUrl);
    } else if (!title && key === "og:title") {
      const value = decodeEntities(content).trim().replace(/\s+/g, " ");
      title = value ? value.slice(0, MAX_TITLE_LENGTH) : null;
    }
    if (image && title) break;
  }
  return { image, title };
}

function readAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of tag.matchAll(ATTR)) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

function absoluteHttpUrl(value: string, base: string): string | null {
  const url = URL.parse(value.trim(), base);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
    return null;
  }
  return url.href;
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    const key = String(body).toLowerCase();
    if (key in NAMED) return NAMED[key];
    const code = key.startsWith("#x")
      ? Number.parseInt(key.slice(2), 16)
      : key.startsWith("#")
        ? Number.parseInt(key.slice(1), 10)
        : Number.NaN;
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : whole;
  });
}
