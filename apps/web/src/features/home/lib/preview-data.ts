import type { BucketTile } from "../ui/BucketTiles";
import type { SharedPage } from "../ui/SharedPages";
import type { CategoryChip, TriageLink } from "../ui/TriageRow";

// 디자인 미리보기(/preview/home, 개발 환경 전용) 샘플. 실제 데이터가 아니므로 실제 홈에서는 쓰지 않는다
export const PREVIEW_LINKS: TriageLink[] = [
  {
    id: "l1",
    url: "https://example.com/landing",
    title: "[미리보기] 랜딩 페이지 레퍼런스",
  },
  {
    id: "l2",
    url: "https://example.org/motion",
    title: "[미리보기] 모션 가이드",
  },
  {
    id: "l3",
    url: "https://example.net/trip",
    title: "[미리보기] 제주 3박 일정",
  },
];

export const PREVIEW_CHIPS: CategoryChip[] = [
  { id: "c1", name: "여행", face: "yellow" },
  { id: "c2", name: "숙소", face: "blue" },
  { id: "c3", name: "개발", face: "red" },
];

export const PREVIEW_CATEGORIES = [
  { id: "c3", name: "개발", count: 12 },
  { id: "c4", name: "디자인", count: 8 },
  { id: "c2", name: "숙소", count: 5 },
  { id: "c1", name: "여행", count: 9 },
];

export const PREVIEW_BUCKETS: BucketTile[] = [
  {
    id: "b1",
    name: "[미리보기] 개발 레퍼런스",
    linkCount: 42,
    updatedLabel: "2일 전 업데이트",
    art: "liquid-blue",
  },
  {
    id: "b2",
    name: "[미리보기] 디자인 영감",
    linkCount: 58,
    updatedLabel: "5일 전 업데이트",
    art: "soft-coral",
  },
  {
    id: "b3",
    name: "[미리보기] 여행 준비",
    linkCount: 27,
    updatedLabel: "1주 전 업데이트",
    art: "warm-light",
  },
];

export const PREVIEW_PAGES: SharedPage[] = [
  {
    id: "p1",
    title: "[미리보기] 좋은 랜딩페이지 모음",
    url: "[공개 주소]/p/landing-ref",
    isPublic: true,
  },
  {
    id: "p2",
    title: "[미리보기] 디자인 시스템 레퍼런스",
    url: "[공개 주소]/p/design-system",
    isPublic: false,
  },
];
