"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { DESIGN_ITEMS, findDesignItem } from "../model/items";

// 사이드바의 기획·디자인 목록. 앱 안 사본은 ?view= 로 본문에 띄우고, claude.ai 시안은
// 다른 사이트 안에 띄울 수 없어(frame-ancestors) 누르면 바로 새 탭으로 연다
export function DesignNav() {
  const pathname = usePathname();
  const current = findDesignItem(useSearchParams().get("view")).key;
  const groups = ["기획", "디자인"] as const;
  return (
    <nav aria-label="기획·디자인 (개발용)" className="flex flex-col gap-1">
      {groups.map((group) => (
        <div key={group} className="flex flex-col gap-1">
          <h2 className="mt-3 border-b border-border-subtle px-3 pb-2 text-sm font-bold text-foreground">
            {group}
          </h2>
          {DESIGN_ITEMS.filter((i) => i.group === group).map((i) =>
            i.embed ? (
              <Link
                key={i.key}
                href={`${pathname}?view=${i.key}`}
                aria-current={i.key === current ? "page" : undefined}
                className={`flex min-h-9 items-center rounded-xl px-3 text-sm focus-visible:focus-ring ${i.key === current ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {i.label}
              </Link>
            ) : (
              <a
                key={i.key}
                href={i.src}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-9 items-center justify-between rounded-xl pr-3 pl-5 text-sm text-muted-foreground hover:bg-muted focus-visible:focus-ring"
              >
                {i.label}
                <span aria-hidden="true">↗</span>
              </a>
            ),
          )}
        </div>
      ))}
    </nav>
  );
}
