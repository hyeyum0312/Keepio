"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeepioIcon, KeepioWordmark } from "@/shared/ui/KeepioWordmark";
import { useSidebarCollapsed } from "../model/useSidebarCollapsed";
import { type IconName, NavIcon } from "./NavIcon";

type NavItem = {
  label: string;
  icon: IconName;
  href?: string;
  // 아직 기능이 없는 메뉴: 보이기는 다른 메뉴와 같고, 누르면 이동하지 않으며 "준비 중"으로 읽힌다
  soon?: boolean;
};

const MAIN: NavItem[] = [
  { label: "홈", icon: "home", href: "/" },
  { label: "전체 링크", icon: "links", href: "/links" },
  { label: "카테고리", icon: "tag", soon: true },
  { label: "버킷", icon: "bucket", soon: true },
  { label: "공유한 페이지", icon: "pages", soon: true },
];
const TABS: NavItem[] = [
  { label: "홈", icon: "home", href: "/" },
  { label: "링크", icon: "links", href: "/links" },
  { label: "버킷", icon: "bucket", soon: true },
  { label: "공유", icon: "pages", soon: true },
];

const PROMO_ART = "/bucket-art/coral.webp";

// 로그인 뒤 화면의 틀(FEAT-009, 2026-11-19 시안): PC는 사이드바(접기·펴기, 1024px 미만은 늘 접힘) + 위쪽 검색·알림·계정,
// 모바일은 머리(로고·계정) + 하단 탭. 휴지통·설정·화면 모드는 계정 메뉴에 있다
export function AppShell({
  account,
  sidebarExtra,
  children,
}: {
  // 계정 버튼(아래로 열림). PC 위쪽 막대와 모바일 머리에 같은 것을 쓴다
  account?: React.ReactNode;
  // 사이드바 주요 메뉴 아래에 붙일 내용(개발용 링크 등). 접힘·좁은 폭에서는 숨긴다
  sidebarExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, toggle] = useSidebarCollapsed();
  // 접힘이면 늘 아이콘만, 펼침이면 1024px 이상에서만 이름까지
  const label = collapsed ? "sr-only" : "sr-only lg:not-sr-only";
  const width = collapsed ? "w-[76px]" : "w-[76px] lg:w-60";
  const wide = collapsed ? "hidden" : "hidden lg:flex";

  function item({ label: text, icon, href, soon }: NavItem) {
    const active = href !== undefined && pathname === href;
    const base =
      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] focus-visible:focus-ring";
    if (soon || !href) {
      return (
        <span
          key={text}
          role="link"
          aria-disabled="true"
          title="준비 중"
          className={`${base} cursor-default text-foreground/85`}
        >
          <NavIcon name={icon} />
          <span className={label}>
            {text}
            <span className="sr-only"> (준비 중)</span>
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
        className={`${base} ${active ? "bg-muted font-semibold text-foreground" : "text-foreground/85 hover:bg-muted"}`}
      >
        <NavIcon name={icon} />
        <span className={label}>{text}</span>
      </Link>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col gap-5 px-4 py-6 md:flex ${width}`}
      >
        <div
          className={`flex items-center gap-2 px-2 ${collapsed ? "flex-col" : "flex-col lg:flex-row lg:justify-between"}`}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:focus-ring"
          >
            {/* 접힘·좁은 폭은 작은 마크, 펼친 넓은 폭은 워드마크(ADR-016) */}
            <KeepioIcon size={28} className={collapsed ? "" : "lg:hidden"} />
            <KeepioWordmark
              size={26}
              className={collapsed ? "hidden" : "hidden lg:inline-flex"}
            />
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            aria-expanded={!collapsed}
            className={`size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:focus-ring ${collapsed ? "inline-flex" : "hidden lg:inline-flex"}`}
          >
            <NavIcon name={collapsed ? "expand" : "collapse"} />
          </button>
        </div>
        <nav aria-label="주요 메뉴" className="flex flex-col gap-1">
          {MAIN.map(item)}
          <div className="mx-3 my-3 border-t border-border-subtle" />
          <Link
            href="/?save=1"
            title="링크 추가"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-foreground/85 hover:bg-muted focus-visible:focus-ring"
          >
            <NavIcon name="plus" />
            <span className={label}>링크 추가</span>
          </Link>
        </nav>
        {sidebarExtra && (
          <div className={`flex-col gap-1 ${wide}`}>{sidebarExtra}</div>
        )}
        <Link
          href="/?save=1"
          className={`relative mt-auto min-h-20 items-center overflow-hidden rounded-2xl p-4 focus-visible:focus-ring ${wide}`}
        >
          <Image
            src={PROMO_ART}
            alt=""
            fill
            sizes="208px"
            className="object-cover"
          />
          <span className="relative flex w-full items-center justify-between gap-2 text-sm leading-snug font-semibold text-on-art">
            <span>
              Keepio로
              <br />
              영감을 모아보세요
            </span>
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-on-art-surface">
              <NavIcon name="arrow" />
            </span>
          </span>
        </Link>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="flex items-center gap-3 px-6 pt-4 md:px-10 md:pt-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:focus-ring md:hidden"
          >
            <KeepioWordmark size={24} />
          </Link>
          <div className="relative hidden max-w-xl flex-1 md:block">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-foreground">
              <NavIcon name="search" />
            </span>
            <label htmlFor="app-search" className="sr-only">
              검색 (준비 중)
            </label>
            <input
              id="app-search"
              type="search"
              disabled
              title="준비 중"
              placeholder="링크, 버킷, 태그 검색"
              className="h-12 w-full rounded-full border border-border-subtle bg-surface pr-5 pl-12 text-[15px] placeholder:text-muted-foreground disabled:cursor-default"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              role="button"
              aria-disabled="true"
              aria-label="알림 (준비 중)"
              title="준비 중"
              className="inline-flex size-11 items-center justify-center rounded-full text-foreground"
            >
              <NavIcon name="bell" />
            </span>
            {account}
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
              role="link"
              aria-disabled="true"
              title="준비 중"
              className="flex min-h-12 flex-col items-center justify-center gap-1 text-caption text-muted-foreground"
            >
              <NavIcon name={icon} />
              {text}
              <span className="sr-only">(준비 중)</span>
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
