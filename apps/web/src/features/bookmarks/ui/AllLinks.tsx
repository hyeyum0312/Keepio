"use client";

import { useState } from "react";
import { BookmarkList, type ListView } from "./BookmarkList";
import { LinkIcon } from "./LinkIcons";
import { SaveBookmarkForm } from "./SaveBookmarkForm";

const VIEWS: { view: ListView; label: string; icon: "list" | "grid" }[] = [
  { view: "list", label: "목록으로 보기", icon: "list" },
  { view: "grid", label: "카드로 보기", icon: "grid" },
];

// 전체 링크(LINK-01, 2026-11-19 시안): 저장 카드 → 정리한 링크(목록형/카드형).
// 보기 방식은 화면 상태라 새로고침하면 목록형으로 돌아간다.
// 검색·정렬·태그 필터·버킷 지정·개수는 서버(FEAT-008·검색)가 생기면 붙인다
export function AllLinks() {
  const [view, setView] = useState<ListView>("list");

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-label="링크 저장"
        className="relative overflow-hidden rounded-3xl border border-border-subtle bg-muted/60"
      >
        <div
          aria-hidden="true"
          className="kp-save-art absolute inset-y-0 left-0 hidden w-56 md:block"
        />
        <div className="relative p-4 md:py-7 md:pr-7 md:pl-40">
          <SaveBookmarkForm />
        </div>
      </section>

      <section aria-labelledby="links-list" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="links-list"
            className="text-xl font-bold tracking-tight md:text-[22px]"
          >
            정리한 링크
          </h2>
          <div
            role="group"
            aria-label="보기 방식"
            className="flex rounded-xl border border-border-subtle bg-surface p-1"
          >
            {VIEWS.map((v) => (
              <button
                key={v.view}
                type="button"
                aria-pressed={view === v.view}
                aria-label={v.label}
                title={v.label}
                onClick={() => setView(v.view)}
                className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:focus-ring aria-pressed:bg-muted aria-pressed:text-foreground"
              >
                <LinkIcon name={v.icon} size={20} />
              </button>
            ))}
          </div>
        </div>
        <BookmarkList status="active" view={view} />
      </section>
    </div>
  );
}
