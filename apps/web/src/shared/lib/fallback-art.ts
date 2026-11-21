// 썸네일이 없거나 이미지를 못 불러올 때 대신 보여 줄 추상 아트워크(07-BRAND 버킷 아트와 같은 4장).
// "랜덤"이지만 항목 ID로 정해서 다시 그려도 같은 그림이 나온다(깜빡임 방지)
export const FALLBACK_ART = [
  "/bucket-art/blue.webp",
  "/bucket-art/coral.webp",
  "/bucket-art/orange.webp",
  "/bucket-art/green.webp",
] as const;

// 문자열(ID)로 목록에서 하나를 고른다. 같은 값이면 늘 같은 항목
export function pickBySeed<T>(seed: string, items: readonly T[]): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

export function fallbackArtFor(seed: string): string {
  return pickBySeed(seed, FALLBACK_ART);
}
