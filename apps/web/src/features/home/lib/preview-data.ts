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
    description: "프레임워크 문서와 좋은 예제 모음",
  },
  {
    id: "b2",
    name: "[미리보기] 디자인 인스피레이션",
    description: "마음에 드는 화면과 무드",
  },
  {
    id: "b3",
    name: "[미리보기] 여행 기록과 준비",
    description: "숙소·맛집·동선을 한곳에",
  },
  {
    // 설명이 없는 버킷: 설명 줄을 그리지 않는다
    id: "b4",
    name: "[미리보기] 생산성 도구 모음",
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
