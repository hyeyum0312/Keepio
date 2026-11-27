"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CatIcon } from "./CatIcons";

export type ManagedCategory = {
  id: string;
  name: string;
  bookmarkCount: number;
  pinned: boolean;
};

// CAT-01 관리 모달(FEAT-008 AC-17 중 고정·삭제). 칩 줄 [관리]로 연다.
// 줄: 핀 · 이름 · 링크 수 · 삭제. 고정한 것이 "고정" 머리글 아래 먼저, 그 아래 "전체"(순서는 서버 값 그대로, AC-14).
// 삭제: 링크가 있으면 확인("링크 N개는 지워지지 않고 미분류가 돼요"), 0개면 바로 지운다(AC-04).
// 닫기: 바깥 누름·Esc·[닫기]. 저장 중에는 닫지 않는다. 열리면 첫 줄로 포커스, 닫으면 부른 쪽이 [관리]로 돌려놓는다.
// 이름 바꾸기·합치기는 다음 범위
export function CategoryManage({
  categories,
  onClose,
  onDelete,
  onPin,
}: {
  categories: ManagedCategory[];
  onClose: () => void;
  // 실패하면 서버 문구(ADR-009)
  onDelete: (categoryId: string) => Promise<string | null>;
  onPin?: (categoryId: string, pinned: boolean) => Promise<string | null>;
}) {
  const titleId = useId();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ManagedCategory | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(
    null,
  );
  const firstRow = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const busy = busyId !== null;
  const pinned = categories.filter((c) => c.pinned);
  const rest = categories.filter((c) => !c.pinned);

  // 열릴 때 첫 줄로 포커스(마운트 한 번)
  useEffect(() => {
    firstRow.current?.focus();
  }, []);

  function close() {
    if (!busy) onClose();
  }

  // 확인을 닫으면 모달 안(첫 줄)으로 포커스를 돌린다(바깥으로 빠지지 않게)
  function cancelConfirm() {
    setConfirming(null);
    requestAnimationFrame(() => (firstRow.current ?? dialog.current)?.focus());
  }

  // Esc: 확인이 열려 있으면 확인만 닫고, 아니면 모달을 닫는다. 포커스 위치와 관계없이 듣는다(해제 경로 있음)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || busy) return;
      e.preventDefault();
      if (confirming) cancelConfirm();
      else onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  async function run(id: string, task: () => Promise<string | null>) {
    setBusyId(id);
    setError(null);
    const message = await task();
    setBusyId(null);
    if (message) setError({ id, message });
    return !message;
  }

  function askDelete(c: ManagedCategory) {
    if (c.bookmarkCount === 0) void run(c.id, () => onDelete(c.id));
    else setConfirming(c);
  }

  async function confirmDelete() {
    if (!confirming) return;
    const target = confirming;
    if (await run(target.id, () => onDelete(target.id))) cancelConfirm();
  }

  function row(c: ManagedCategory, index: number) {
    const rowBusy = busyId === c.id;
    return (
      <li key={c.id} className="flex flex-col gap-1 py-1">
        <div className="flex items-center gap-2">
          {onPin && (
            <button
              ref={index === 0 ? firstRow : undefined}
              type="button"
              aria-pressed={c.pinned}
              aria-label={`${c.name} ${c.pinned ? "고정 해제" : "고정"}`}
              disabled={busy}
              onClick={() => void run(c.id, () => onPin(c.id, !c.pinned))}
              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg focus-visible:focus-ring ${
                c.pinned ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <CatIcon name="pin" size={18} />
            </button>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {c.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            링크 {c.bookmarkCount}개
          </span>
          <button
            ref={index === 0 && !onPin ? firstRow : undefined}
            type="button"
            disabled={busy}
            onClick={() => askDelete(c)}
            aria-label={`${c.name} 삭제`}
            className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-destructive focus-visible:focus-ring disabled:opacity-50"
          >
            {rowBusy ? "삭제 중…" : "삭제"}
          </button>
        </div>
        {error?.id === c.id && !confirming && (
          <p role="alert" className="text-xs text-destructive">
            {error.message}
          </p>
        )}
      </li>
    );
  }

  return (
    <div className="fixed inset-0 z-40">
      <div
        aria-hidden="true"
        onClick={close}
        className="kp-backdrop absolute inset-0"
      />
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col gap-3 rounded-t-3xl bg-surface px-5 pt-4 pb-6 shadow-[0_-8px_24px_var(--shadow-soft)] md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[440px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold">
            카테고리 관리
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="min-h-11 rounded-lg px-3 text-sm font-medium focus-visible:focus-ring"
          >
            닫기
          </button>
        </div>

        {confirming ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              &apos;{confirming.name}&apos;을(를) 삭제할까요? 링크{" "}
              {confirming.bookmarkCount}개는 지워지지 않고{" "}
              <strong>미분류</strong>가 돼요. 카테고리만 사라져요.
            </p>
            {error?.id === confirming.id && (
              <p role="alert" className="text-xs text-destructive">
                {error.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={cancelConfirm}
                className="min-h-11 rounded-xl bg-muted px-4 text-sm font-medium focus-visible:focus-ring"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="min-h-11 rounded-xl bg-destructive px-4 text-sm font-semibold text-primary-foreground focus-visible:focus-ring disabled:opacity-50"
              >
                {busy ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        ) : (
          <div className="-mx-1 overflow-y-auto px-1">
            {pinned.length > 0 && (
              <>
                <h3 className="pt-1 text-xs font-semibold text-muted-foreground">
                  고정
                </h3>
                <ul>{pinned.map((c, i) => row(c, i))}</ul>
              </>
            )}
            <h3 className="pt-2 text-xs font-semibold text-muted-foreground">
              전체
            </h3>
            <ul>{rest.map((c, i) => row(c, pinned.length + i))}</ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {categories.length}개 · 고정 {pinned.length}
        </p>
      </div>
    </div>
  );
}
