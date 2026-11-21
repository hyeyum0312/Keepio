"use client";

import { useEffect, useRef, useState } from "react";
import { LinkIcon } from "./LinkIcons";

const ITEM =
  "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm hover:bg-muted focus-visible:focus-ring disabled:opacity-50";

// 링크 한 줄의 ⋯ 메뉴(LINK-01 시안, FEAT-011 AC-01·05). 수정 → 이미지 바꾸기 → (구분선) → 삭제.
// 바깥을 누르거나 Esc를 누르면 닫는다. 리스너는 열려 있을 때만 붙이고 닫히면 뗀다.
// triggerId: 수정을 마친 뒤 포커스를 이 버튼으로 돌리려고 쓴다
export function RowMenu({
  label,
  triggerId,
  disabled,
  imageLabel = "이미지 바꾸기",
  onEdit,
  onReplaceImage,
  onDelete,
}: {
  // 스크린 리더용 대상 이름(링크 제목)
  label: string;
  triggerId?: string;
  disabled: boolean;
  imageLabel?: string;
  onEdit?: () => void;
  onReplaceImage?: () => void;
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
        // 목록의 Esc(선택 풀기)보다 먼저 메뉴만 닫는다
        event.stopImmediatePropagation();
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

  function choose(run: () => void) {
    setOpen(false);
    run();
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        id={triggerId}
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
          className="absolute top-full right-0 z-20 mt-1 min-w-40 rounded-xl border border-border-subtle bg-surface p-1 shadow-[0_8px_24px_var(--shadow-soft)]"
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              autoFocus
              disabled={disabled}
              onClick={() => choose(onEdit)}
              className={`${ITEM} text-foreground`}
            >
              <LinkIcon name="pencil" size={16} />
              수정
            </button>
          )}
          {onReplaceImage && (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => choose(onReplaceImage)}
              className={`${ITEM} text-foreground`}
            >
              <LinkIcon name="image" size={16} />
              {imageLabel}
            </button>
          )}
          {(onEdit || onReplaceImage) && (
            <div role="separator" className="mx-2 my-1 h-px bg-border-subtle" />
          )}
          <button
            type="button"
            role="menuitem"
            autoFocus={!onEdit}
            disabled={disabled}
            onClick={() => choose(onDelete)}
            className={`${ITEM} text-destructive`}
          >
            <LinkIcon name="trash" size={16} />
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
