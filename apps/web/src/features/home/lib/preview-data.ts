import type { BucketTile } from "../ui/BucketTiles";
import type { SharedPage } from "../ui/SharedPages";
import type { TriageCategory, TriageLink } from "../ui/TriageRow";

// 디자인 미리보기(/preview/home, 개발 환경 전용) 샘플. 실제 데이터가 아니므로 실제 홈에서는 쓰지 않는다
export const PREVIEW_LINKS: TriageLink[] = [
  {
    id: "l1",
    url: "https://www.awwwards.com",
    title: "[미리보기] Awwwards – Website Awards",
    // 썸네일을 못 불러오는 경우: 아트워크로 대신하는지 확인용
    thumbnailUrl: "/preview-missing-thumbnail.jpg",
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

// 정리할 링크의 카테고리 선택(첫 항목이 AI 추천 자리)
export const PREVIEW_CATEGORIES: TriageCategory[] = [
  { id: "c4", name: "디자인" },
  { id: "c3", name: "개발" },
  { id: "c2", name: "숙소" },
  { id: "c1", name: "여행" },
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
    name: "[미리보기] 디자인 인스피레이션",
    linkCount: 58,
    updatedLabel: "5일 전 업데이트",
    art: "soft-coral",
  },
  {
    id: "b3",
    name: "[미리보기] 여행 기록과 준비",
    linkCount: 27,
    updatedLabel: "1주 전 업데이트",
    art: "warm-light",
  },
  {
    id: "b4",
    name: "[미리보기] 생산성 도구 모음",
    linkCount: 18,
    updatedLabel: "3일 전 업데이트",
    art: "botanical",
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
