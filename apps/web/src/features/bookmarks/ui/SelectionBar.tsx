"use client";

import { LinkIcon } from "./LinkIcons";

// FEAT-011 AC-08. 하나라도 고르면 화면 아래에 붙는 작업 막대. PC는 가운데 알약, 모바일은 하단 탭 자리.
// 버킷·공유 페이지·카테고리는 서버 기능 전까지 "준비 중"(누를 수 없음)
const SOON = ["버킷에 추가", "공유 페이지 만들기", "카테고리 변경"] as const;
const SOON_SHORT: Record<(typeof SOON)[number], string> = {
  "버킷에 추가": "버킷에 추가",
  "공유 페이지 만들기": "공유 페이지",
  "카테고리 변경": "카테고리",
};

export function SelectionBar({
  count,
  showPc,
  deleting,
  onDelete,
  onClear,
}: {
  count: number;
  // PC 막대는 하나라도 골랐을 때만(모바일 막대는 선택 모드면 늘)
  showPc: boolean;
  deleting: boolean;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <>
      <div
        role="toolbar"
        aria-label="선택한 링크 작업"
        className={`sticky bottom-6 z-20 hidden items-center gap-1.5 self-center rounded-full bg-primary py-2 pr-2 pl-5 text-primary-foreground shadow-[0_8px_24px_var(--shadow-soft)] ${showPc ? "md:flex" : ""}`}
      >
        <strong className="mr-2 text-sm">{count}개 선택</strong>
        {SOON.map((name, i) => (
          <span
            key={name}
            role="button"
            aria-disabled="true"
            title="준비 중"
            className={`inline-flex min-h-10 cursor-default items-center rounded-full px-3.5 text-[13px] ${
              i === 0
                ? "bg-on-art-surface font-bold text-on-art opacity-70"
                : "bg-primary-foreground/15 opacity-70"
            }`}
          >
            {name}
            <span className="sr-only"> (준비 중)</span>
          </span>
        ))}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="kp-delete-on-primary inline-flex min-h-10 items-center rounded-full bg-primary-foreground/15 px-3.5 text-[13px] focus-visible:focus-ring disabled:opacity-50"
        >
          {deleting ? "옮기는 중" : "삭제"}
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="선택 해제"
          className="inline-flex size-10 items-center justify-center rounded-full opacity-80 focus-visible:focus-ring"
        >
          <LinkIcon name="close" size={16} />
        </button>
      </div>
      {/* 모바일: 하단 탭 위를 덮는다. 선택을 푸는 것은 머리의 "완료" */}
      <div
        role="toolbar"
        aria-label="선택한 링크 작업"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border-subtle bg-background px-2 pt-1.5 pb-4 md:hidden"
      >
        {SOON.map((name) => (
          <span
            key={name}
            role="button"
            aria-disabled="true"
            title="준비 중"
            className="flex min-h-13 items-center justify-center text-caption text-muted-foreground"
          >
            {SOON_SHORT[name]}
            <span className="sr-only"> (준비 중)</span>
          </span>
        ))}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting || count === 0}
          className="flex min-h-13 items-center justify-center rounded-xl text-caption font-semibold text-destructive focus-visible:focus-ring disabled:opacity-50"
        >
          {deleting ? "옮기는 중" : "삭제"}
        </button>
      </div>
    </>
  );
}
