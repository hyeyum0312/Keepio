// 개발용 기획·디자인 목록(dev 배포 전까지 임시, 이후 별도 문서 레포로 옮긴다).
// 앱 안 사본은 화면에 바로 띄우고, claude.ai 시안은 다른 사이트 안에 띄울 수 없어 새 탭으로 연다
export type DesignItem = {
  key: string;
  label: string;
  group: "기획" | "디자인";
  src: string;
  embed: boolean;
};

export const DESIGN_ITEMS: DesignItem[] = [
  {
    key: "wireflow",
    label: "워크플로우",
    group: "기획",
    src: "/preview/wireflow",
    embed: true,
  },
  {
    key: "all",
    label: "디자인 전체",
    group: "디자인",
    src: "https://claude.ai/artifact/TVK97VZWLdiXH6GdM6PiBx",
    embed: false,
  },
  {
    key: "brand",
    label: "브랜드 / 로고 디자인",
    group: "디자인",
    src: "https://claude.ai/artifact/QFoV9g8zkXgcnhkHbohwdC",
    embed: false,
  },
  {
    key: "auth-01",
    label: "AUTH-01 시작시안",
    group: "디자인",
    src: "https://claude.ai/artifact/GkXw4iykkY9j9GHe8DzwAj",
    embed: false,
  },
  {
    key: "auth-02",
    label: "AUTH-02 가입시안",
    group: "디자인",
    src: "https://claude.ai/artifact/MguvY2as5LXgGUiqQ2N7Ws",
    embed: false,
  },
];

export function findDesignItem(key: string | null): DesignItem {
  return DESIGN_ITEMS.find((i) => i.key === key) ?? DESIGN_ITEMS[0];
}
