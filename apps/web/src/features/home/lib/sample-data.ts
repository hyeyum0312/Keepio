import type { BucketTile } from "../ui/BucketTiles";
import type { TriageLink } from "../ui/TriageRow";
import { BUCKET_ART } from "./bucket-art";

// 링크가 하나도 없을 때 홈에 보여 주는 예시(2026-11-19 시안 "예시로 채운 첫 화면").
// 화면에만 있고 서버에 저장하지 않는다. 썸네일은 우리 버킷 아트워크만 쓴다(외부 이미지 저작권)
export const SAMPLE_TRIAGE: TriageLink = {
  id: "sample-triage",
  url: "/links",
  title: "예시 · 링크는 여기서 하나씩 정리해요",
  displayTitle: "예시 · 링크는 여기서 하나씩 정리해요",
  thumbnailUrl: BUCKET_ART.botanical,
};

export const SAMPLE_BUCKETS: BucketTile[] = [
  {
    id: "sample-trip",
    name: "예시 · 여름 여행 레퍼런스",
    linkCount: 12,
    updatedLabel: "숙소·맛집을 한곳에",
    art: "liquid-blue",
  },
  {
    id: "sample-brand",
    name: "예시 · 브랜딩 무드보드",
    linkCount: 8,
    updatedLabel: "마음에 드는 디자인 모으기",
    art: "soft-coral",
  },
  {
    id: "sample-read",
    name: "예시 · 읽을거리",
    linkCount: 5,
    updatedLabel: "나중에 볼 글 쌓아 두기",
    art: "warm-light",
  },
];
