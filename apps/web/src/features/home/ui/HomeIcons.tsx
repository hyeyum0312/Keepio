// 홈 카드 안의 작은 선 아이콘(24px 격자, 선 1.6px). 장식이라 aria-hidden
const PATHS = {
  folder: "M3 7h6l2 2h10v10H3z",
  chevron: "M6 9l6 6 6-6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  bookmark: "M7 3h10v18l-5-4-5 4z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  arrow: "M5 12h14M13 6l6 6-6 6",
} as const;

export function HomeIcon({
  name,
  size = 18,
  filled = false,
}: {
  name: keyof typeof PATHS;
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={name === "more" ? 3 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
