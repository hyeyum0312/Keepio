// FEAT-007 AC-03. 버튼 오른쪽 위 작은 말풍선
export function RecentBadge() {
  return (
    <span className="pointer-events-none absolute -top-2.5 right-3 rounded-full bg-foreground px-2 py-1 text-xs leading-none font-semibold text-background">
      최근 사용
    </span>
  );
}
