// 사이드바·하단 탭 선 아이콘(24px 격자, 선 1.6px, 07-BRAND 6장). 장식이라 aria-hidden
const PATHS = {
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z",
  links:
    "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  inbox: "M4 6h16v12H4zM4 13h5l1 2h4l1-2h5",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01",
  search: "M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 20l-4.2-4.2",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  bucket: "M3 7h6l2 2h10v10H3z",
  pages: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  settings:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  plus: "M12 5v14M5 12h14",
  collapse: "M15 6l-6 6 6 6",
  expand: "M9 6l6 6-6 6",
} as const;

export type IconName = keyof typeof PATHS;

export function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
