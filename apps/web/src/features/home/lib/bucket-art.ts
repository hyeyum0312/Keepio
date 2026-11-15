// 버킷 썸네일 프리셋(07-BRAND 7장: 사진 기반 추상 아트워크, 캐릭터 없음). 버킷의 cover_preset 값과 1:1.
// 이미지는 임시(시안에서 자른 저해상도). 원본(1000px 이상 WebP)이 오면 같은 이름으로 교체한다
export const BUCKET_ART = {
  "liquid-blue": "/bucket-art/blue.webp",
  "soft-coral": "/bucket-art/coral.webp",
  "warm-light": "/bucket-art/orange.webp",
  botanical: "/bucket-art/green.webp",
} as const;

export type BucketArt = keyof typeof BUCKET_ART;
