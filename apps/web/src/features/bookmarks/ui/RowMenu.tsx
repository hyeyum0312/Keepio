"use client";

import { useEffect, useRef, useState } from "react";
import { LinkIcon } from "./LinkIcons";

// 링크 한 줄의 ⋯ 메뉴(LINK-01 시안). 바깥을 누르거나 Esc를 누르면 닫는다.
// 리스너는 열려 있을 때만 붙이고 닫히면 뗀다
export function RowMenu({
  label,
  disabled,
  onDelete,
}: {
  // 스크린 리더용 대상 이름(링크 제목)
  label: string;
  disabled: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`더보기: ${label}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:focus-ring"
      >
        <LinkIcon name="more" size={20} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`${label} 메뉴`}
          className="absolute top-full right-0 z-10 mt-1 min-w-36 rounded-xl border border-border-subtle bg-surface p-1 shadow-[0_8px_24px_var(--shadow-soft)]"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            disabled={disabled}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-destructive hover:bg-muted focus-visible:focus-ring disabled:opacity-50"
          >
            <LinkIcon name="trash" size={16} />
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
