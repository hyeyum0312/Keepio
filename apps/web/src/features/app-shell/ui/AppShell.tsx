"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeepioMark } from "@/shared/ui/KeepioMark";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { useSidebarCollapsed } from "../model/useSidebarCollapsed";
import { type IconName, NavIcon } from "./NavIcon";

export type SidebarCategory = { id: string; name: string; count: number };

type NavItem = {
  label: string;
  icon: IconName;
  href?: string;
  // 아직 기능이 없는 메뉴: 누를 수 없고 "준비 중"으로 읽힌다(가짜 화면을 만들지 않는다)
  soon?: boolean;
};

const MAIN: NavItem[] = [
  { label: "홈", icon: "home", href: "/" },
  { label: "전체 링크", icon: "links", href: "/links" },
  { label: "미분류", icon: "inbox", soon: true },
];
const MORE: NavItem[] = [
  { label: "버킷", icon: "bucket", soon: true },
  { label: "공유한 페이지", icon: "pages", soon: true },
  { label: "휴지통", icon: "trash", href: "/trash" },
  { label: "설정", icon: "settings", soon: true },
];
const TABS: NavItem[] = [
  { label: "홈", icon: "home", href: "/" },
  { label: "링크", icon: "links", href: "/links" },
  { label: "버킷", icon: "bucket", soon: true },
  { label: "공유", icon: "pages", soon: true },
];

// 로그인 뒤 화면의 틀(FEAT-009): PC는 고정 사이드바(접기·펴기, 1024px 미만은 늘 접힘), 모바일은 하단 탭.
// 카테고리 목록은 서버(FEAT-008)가 주면 받는다. 없으면 그 영역을 그리지 않는다
export function AppShell({
  account,
  categories = [],
  children,
}: {
  // 계정 버튼. 사이드바에서는 위로, 모바일 머리에서는 아래로 열린다
  account?: { up: React.ReactNode; down: React.ReactNode };
  categories?: SidebarCategory[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, toggle] = useSidebarCollapsed();
  // 접힘이면 늘 아이콘만, 펼침이면 1024px 이상에서만 이름까지
  const label = collapsed ? "sr-only" : "sr-only lg:not-sr-only";
  const width = collapsed ? "w-[72px]" : "w-[72px] lg:w-64";

  function item({ label: text, icon, href, soon }: NavItem) {
    const active = href !== undefined && pathname === href;
    const base =
      "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm focus-visible:focus-ring";
    if (soon || !href) {
      return (
        <span
          key={text}
          aria-disabled="true"
          title={`${text} · 준비 중`}
          className={`${base} cursor-not-allowed text-muted-foreground opacity-60`}
        >
          <NavIcon name={icon} />
          <span className={label}>
            {text} <span className="text-caption">· 준비 중</span>
          </span>
        </span>
      );
    }
    return (
      <Link
        key={text}
        href={href}
        aria-current={active ? "page" : undefined}
        title={text}
        className={`${base} ${active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
      >
        <NavIcon name={icon} />
        <span className={label}>{text}</span>
      </Link>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r border-border-subtle px-3 py-5 md:flex ${width}`}
      >
        <div className="flex items-center justify-between gap-2 px-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:focus-ring"
          >
            <KeepioMark height={24} />
            <span className={`text-lg font-semibold tracking-tight ${label}`}>
              keepio
            </span>
          </Link>
        </div>
        <nav aria-label="주요 메뉴" className="flex flex-col gap-1">
          {MAIN.map(item)}
          <Link
            href="/?save=1"
            title="링크 추가"
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-muted focus-visible:focus-ring"
          >
            <NavIcon name="plus" />
            <span className={label}>링크 추가</span>
          </Link>
        </nav>
        {categories.length > 0 && (
          <nav
            aria-label="카테고리"
            className={`min-h-0 flex-1 flex-col gap-1 overflow-y-auto ${collapsed ? "hidden" : "hidden lg:flex"}`}
          >
            <p className="px-3 pt-2 pb-1 text-caption text-muted-foreground">
              카테고리
            </p>
            {categories.map((c) => (
              <span
                key={c.id}
                className="flex min-h-9 items-center justify-between rounded-xl px-3 text-sm text-muted-foreground"
              >
                {c.name}
                <span className="text-caption tabular-nums">{c.count}</span>
              </span>
            ))}
          </nav>
        )}
        <nav
          aria-label="더보기"
          className="mt-auto flex flex-col gap-1 border-t border-border-subtle pt-3"
        >
          {MORE.map(item)}
        </nav>
        <div
          className={`flex items-center gap-2 px-1 ${collapsed ? "flex-col" : "flex-col lg:flex-row lg:justify-between"}`}
        >
          {account?.up}
          <div
            className={`flex items-center gap-1 ${collapsed ? "flex-col" : "flex-col lg:flex-row"}`}
          >
            <ThemeToggle />
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
              aria-expanded={!collapsed}
              className={`size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:focus-ring ${collapsed ? "inline-flex" : "hidden lg:inline-flex"}`}
            >
              <NavIcon name={collapsed ? "expand" : "collapse"} />
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="flex items-center justify-between px-6 pt-4 md:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:focus-ring"
          >
            <KeepioMark height={22} />
            <span className="text-lg font-semibold tracking-tight">keepio</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {account?.down}
          </div>
        </header>
        {children}
      </div>
      <nav
        aria-label="하단 메뉴"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border-subtle bg-background px-2 pt-1.5 pb-4 md:hidden"
      >
        {TABS.map(({ label: text, icon, href, soon }) =>
          soon || !href ? (
            <span
              key={text}
              aria-disabled="true"
              className="flex min-h-12 flex-col items-center justify-center gap-1 text-caption text-muted-foreground opacity-60"
            >
              <NavIcon name={icon} />
              {text}
            </span>
          ) : (
            <Link
              key={text}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-caption focus-visible:focus-ring ${pathname === href ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              <NavIcon name={icon} />
              {text}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
