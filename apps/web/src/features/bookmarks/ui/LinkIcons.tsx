// 링크 화면의 작은 선 아이콘(24px 격자, 선 1.6px). 장식이라 aria-hidden.
// 홈의 HomeIcon과 같은 격자·선 굵기(기능 경계 때문에 따로 둔다)
const PATHS = {
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  chevron: "M6 9l6 6 6-6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  list: "M4 6h16M4 12h16M4 18h16",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  pencil: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  image: "M4 5h16v14H4zM4 15l4-4 5 5 3-3 4 4",
  close: "M6 6l12 12M18 6L6 18",
} as const;

export function LinkIcon({
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
      strokeWidth={name === "more" ? 3 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
