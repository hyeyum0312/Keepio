import type { BucketTile } from "../ui/BucketTiles";
import type { SharedPage } from "../ui/SharedPages";
import type { TriageLink } from "../ui/TriageRow";
import { BUCKET_ART } from "./bucket-art";

// 링크가 하나도 없을 때 홈에 보여 주는 예시(2026-11-21 시안 "1-B. 예시로 채운 첫 화면").
// 화면에만 있고 서버에 저장하지 않는다. 예시라는 표시는 섹션 제목 옆 "예시" 표시가 맡는다(이름에 붙이지 않음).
// 썸네일은 우리 버킷 아트워크만 쓴다(외부 이미지 저작권)
export const SAMPLE_TRIAGE: TriageLink = {
  id: "sample-triage",
  url: "/links",
  title: "저장한 링크는 여기서 하나씩 정리해요",
  displayTitle: "저장한 링크는 여기서 하나씩 정리해요",
  meta: "keepio 가이드 · 카테고리를 만들어 이 링크를 정리해 보세요",
  thumbnailUrl: BUCKET_ART.botanical,
};

// 예시 버킷은 설명 줄 없이 이름만(시안)
export const SAMPLE_BUCKETS: BucketTile[] = [
  { id: "sample-trip", name: "여름 여행 레퍼런스", art: "liquid-blue" },
  { id: "sample-brand", name: "브랜딩 무드보드", art: "soft-coral" },
  { id: "sample-read", name: "읽을거리", art: "warm-light" },
];

export const SAMPLE_PAGES: SharedPage[] = [
  {
    id: "sample-page-trip",
    title: "여름 여행 레퍼런스",
    url: "keepio.app/p/summer-trip",
    isPublic: true,
  },
  {
    id: "sample-page-brand",
    title: "브랜딩 무드보드",
    url: "keepio.app/p/branding-mood",
    isPublic: false,
  },
];
