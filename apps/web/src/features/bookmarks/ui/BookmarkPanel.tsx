"use client";

import { useState } from "react";
import type { BookmarkStatus } from "../model/useBookmarkPages";
import { BookmarkList } from "./BookmarkList";
import { SaveBookmarkForm } from "./SaveBookmarkForm";

const TABS: { status: BookmarkStatus; label: string }[] = [
  { status: "active", label: "내 링크" },
  { status: "deleted", label: "휴지통" },
];

// FEAT-002 로그인 홈: 저장 + [내 링크]/[휴지통] 목록. 기능 위주 최소 UI(D-09 전)
export function BookmarkPanel() {
  const [status, setStatus] = useState<BookmarkStatus>("active");

  return (
    <section className="flex flex-col gap-4" aria-label="북마크">
      <SaveBookmarkForm />
      <div className="flex gap-2" role="group" aria-label="목록 선택">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            aria-pressed={status === tab.status}
            onClick={() => setStatus(tab.status)}
            className="rounded border px-3 py-1 text-sm font-medium aria-pressed:underline"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <BookmarkList key={status} status={status} />
    </section>
  );
}
