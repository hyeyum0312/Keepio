// FEAT-010 AC-04·07·12·15. 링크 페이지 HTML에서 대표 이미지·제목·파비콘 주소만 읽는다.
// 전체 HTML 파서를 쓰지 않는다: <meta>·<link>·<title> 태그만 정규식으로 꺼내고, 값은 길이 제한·엔티티 해제 후 쓴다
export type OpenGraph = {
  image: string | null;
  title: string | null;
  // AC-15. 사이트 아이콘 주소(없으면 null, 화면이 /favicon.ico로 대체)
  icon: string | null;
};

const META_TAG = /<meta\b[^>]*>/gi;
const LINK_TAG = /<link\b[^>]*>/gi;
const TITLE_TAG = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i;
const ATTR = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const MAX_TITLE_LENGTH = 300;

// 앞에 있을수록 우선. HTML 안 순서와 관계없이 이 순서로 고른다(AC-12)
const IMAGE_KEYS = [
  "og:image",
  "og:image:url",
  "twitter:image",
  "twitter:image:src",
];
const TITLE_KEYS = ["og:title", "twitter:title"];

export function parseOpenGraph(html: string, pageUrl: string): OpenGraph {
  const meta = new Map<string, string>();
  for (const tag of html.match(META_TAG) ?? []) {
    const attrs = readAttrs(tag);
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    if (!key || attrs.content === undefined || meta.has(key)) continue;
    meta.set(key, attrs.content);
  }
  return {
    image: pickImage(meta, html, pageUrl),
    title: pickTitle(meta, html),
    icon: pickIcon(html, pageUrl),
  };
}

// AC-15. apple-touch-icon(보통 180px로 선명) → icon·shortcut icon 순, 같은 순위면 sizes가 큰 것.
// mask-icon(단색 윤곽)은 쓰지 않는다
function pickIcon(html: string, pageUrl: string): string | null {
  let best: { rank: number; size: number; url: string } | null = null;
  for (const tag of html.match(LINK_TAG) ?? []) {
    const attrs = readAttrs(tag);
    const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    const rank = rel.some((r) => r.startsWith("apple-touch-icon"))
      ? 0
      : rel.includes("icon")
        ? 1
        : -1;
    if (rank < 0 || !attrs.href) continue;
    const url = absoluteHttpUrl(decodeEntities(attrs.href), pageUrl);
    if (!url) continue;
    const size = iconSize(attrs.sizes);
    if (!best || rank < best.rank || (rank === best.rank && size > best.size)) {
      best = { rank, size, url };
    }
  }
  return best?.url ?? null;
}

// "32x32 192x192" → 192, "any"(SVG) → 크게, 없으면 0
function iconSize(sizes: string | undefined): number {
  if (!sizes) return 0;
  let max = 0;
  for (const part of sizes.toLowerCase().split(/\s+/)) {
    if (part === "any") return 1024;
    const n = Number.parseInt(part.split("x")[0] ?? "", 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max;
}

function pickImage(
  meta: Map<string, string>,
  html: string,
  pageUrl: string,
): string | null {
  for (const key of IMAGE_KEYS) {
    const value = meta.get(key);
    const url = value && absoluteHttpUrl(decodeEntities(value), pageUrl);
    if (url) return url;
  }
  for (const tag of html.match(LINK_TAG) ?? []) {
    const attrs = readAttrs(tag);
    const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    if (!rel.includes("image_src") || !attrs.href) continue;
    const url = absoluteHttpUrl(decodeEntities(attrs.href), pageUrl);
    if (url) return url;
  }
  return null;
}

function pickTitle(meta: Map<string, string>, html: string): string | null {
  for (const key of TITLE_KEYS) {
    const title = cleanTitle(meta.get(key));
    if (title) return title;
  }
  // <title> 안의 태그(잘못된 마크업)는 지운다
  return cleanTitle(TITLE_TAG.exec(html)?.[1]?.replace(/<[^>]*>/g, ""));
}

function cleanTitle(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const value = decodeEntities(raw).trim().replace(/\s+/g, " ");
  return value ? value.slice(0, MAX_TITLE_LENGTH) : null;
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
