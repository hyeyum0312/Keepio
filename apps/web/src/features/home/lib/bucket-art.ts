import { pickBySeed } from "@/shared/lib/fallback-art";

// 버킷 썸네일 프리셋(07-BRAND 7장: 추상 아트워크, 캐릭터 없음). 버킷의 cover_preset 값과 1:1.
// 처음 4장은 임시(시안에서 자른 저해상도). 원본(1000px 이상 WebP)이 오면 같은 이름으로 교체한다.
// 중성 톤 8장(2026-11-21, v4)은 코드로 만든 원본(1200×750, 사진·외부 이미지 미사용)
export const BUCKET_ART = {
  "liquid-blue": "/bucket-art/blue.webp",
  "soft-coral": "/bucket-art/coral.webp",
  "warm-light": "/bucket-art/orange.webp",
  botanical: "/bucket-art/green.webp",
  "slate-beam": "/bucket-art/slate-beam.webp",
  "dusk-bloom": "/bucket-art/dusk-bloom.webp",
  "ink-bloom": "/bucket-art/ink-bloom.webp",
  "sage-wanderer": "/bucket-art/sage-wanderer.webp",
  "clay-ribs": "/bucket-art/clay-ribs.webp",
  "stone-blend": "/bucket-art/stone-blend.webp",
  "mist-signal": "/bucket-art/mist-signal.webp",
  "teal-facet": "/bucket-art/teal-facet.webp",
} as const;

export type BucketArt = keyof typeof BUCKET_ART;

// 사용자가 썸네일을 고르지 않은 버킷에 보여 줄 그림(2026-11-21 사용자 결정: 중성 톤 8장 중 랜덤).
// "랜덤"이지만 버킷 ID로 정해서 다시 그려도 같은 그림이 나온다(깜빡임 방지)
export const DEFAULT_BUCKET_ART = [
  "slate-beam",
  "dusk-bloom",
  "ink-bloom",
  "sage-wanderer",
  "clay-ribs",
  "stone-blend",
  "mist-signal",
  "teal-facet",
] as const satisfies readonly BucketArt[];

export function bucketArtFor(bucket: { id: string; art?: BucketArt }) {
  return BUCKET_ART[bucket.art ?? pickBySeed(bucket.id, DEFAULT_BUCKET_ART)];
}
