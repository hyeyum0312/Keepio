// 카테고리 화면의 작은 선 아이콘(24px 격자, 선 1.6px). 장식이라 aria-hidden.
// 홈·링크 아이콘과 같은 격자·선 굵기(기능 경계 때문에 따로 둔다)
const PATHS = {
  folder: "M3 7h6l2 2h10v10H3z",
  chevron: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  // FEAT-008 AC-15 고정 핀
  pin: "M9 4h6l-1 6 4 3H6l4-3zM12 13v7",
  search: "M16 16l4 4M4.5 11a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0",
} as const;

export function CatIcon({
  name,
  size = 18,
}: {
  name: keyof typeof PATHS;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
