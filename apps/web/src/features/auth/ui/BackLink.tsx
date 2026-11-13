import Link from "next/link";

// 카드 맨 위 "← …" 되돌아가기(FEAT-007). 주소를 바꾸지 않고 교체해 뒤로 가기가 꼬이지 않게 한다
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      replace
      className="-ml-2 inline-flex h-11 items-center gap-1 self-start rounded-lg px-2 text-sm text-muted-foreground focus-visible:focus-ring"
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}
