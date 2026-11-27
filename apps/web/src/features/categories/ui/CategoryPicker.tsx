"use client";

import { useEffect, useId, useRef, useState } from "react";
import { matches, sameName } from "../lib/match";
import type { CreateCategoryResult } from "../model/useCategories";
import { CatIcon } from "./CatIcons";

export type PickerCategory = {
  id: string;
  name: string;
  bookmarkCount: number;
  pinned: boolean;
};

const MAX_CATEGORY_LENGTH = 20;
const NAME_INVALID_MESSAGE = "카테고리 이름은 1~20자로 입력해 주세요.";

// FEAT-008 AC-13 고르기 부품: 검색 + 고르기 + 만들기를 한 부품으로.
// 열면 전체 목록이 보이고(안 쳐도 고를 수 있다), 글자를 넣으면 공백·대소문자를 무시하고 좁혀진다.
// 맨 아래에만 `새 카테고리 "..." 만들기`. 똑같은 이름이 이미 있으면 만들지 않고 그 카테고리를 고른다.
// 고정(AC-15)은 줄의 핀으로 바로 켜고 끈다. 이름 바꾸기·합치기·삭제는 관리 모달에서만 한다(CAT-01).
// 정렬은 서버가 정한 순서를 그대로 쓴다(고정 → 한글 → 영문 → 숫자 → 그 밖 → 이름순, AC-14)
export function CategoryPicker({
  value,
  categories,
  onSelect,
  onCreate,
  onPin,
}: {
  // 지금 정해진 카테고리 id(없으면 null)
  value: string | null;
  categories: PickerCategory[];
  onSelect: (categoryId: string) => void;
  // 이름으로 만들고 적용한다. 성공하면 그 카테고리가 골라진 채로 닫고, 실패하면 서버 문구를 목록 아래에 보여 준다.
  // 없으면(카테고리 서버 전) 맨 아래 만들기 줄을 그리지 않는다
  onCreate?: (name: string) => Promise<CreateCategoryResult>;
  onPin?: (categoryId: string, pinned: boolean) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const current = categories.find((c) => c.id === value) ?? null;
  const found = query
    ? categories.filter((c) => matches(c.name, query))
    : categories;
  const exact = categories.find((c) => sameName(c.name, query)) ?? null;
  const trimmed = query.trim();
  const tooLong = trimmed.length > MAX_CATEGORY_LENGTH;
  // 맨 아래 만들기 줄: 이름을 넣었고 똑같은 이름이 없을 때만
  const creatable = !!onCreate && trimmed.length > 0 && !exact;

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // 열고 닫을 때 상태를 손으로 되돌린다(효과 안에서 setState를 부르지 않는다)
  function openPanel() {
    setQuery("");
    setActive(-1);
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function pick(categoryId: string) {
    onSelect(categoryId);
    close();
  }

  async function create() {
    if (saving) return;
    if (exact) return pick(exact.id);
    if (!onCreate || !trimmed || tooLong) return;
    setSaving(true);
    const result = await onCreate(trimmed);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      search.current?.focus();
      return;
    }
    // 만든(또는 같은 이름으로 이미 있던) 카테고리를 골라진 채로 둔다
    pick(result.categoryId);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const last = found.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i >= last ? last : i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? -1 : i - 1));
      return;
    }
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      // 목록에 들어가 있으면 그것을 고르고, 아니면 만든다(똑같은 이름이면 그것을 고른다)
      if (active >= 0 && found[active]) pick(found[active].id);
      else void create();
    }
  }

  return (
    <div className="relative inline-flex" ref={box}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openPanel())}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 text-sm font-medium focus-visible:focus-ring"
      >
        <CatIcon name="folder" />
        {current ? (
          current.name
        ) : (
          <span className="font-normal text-muted-foreground">
            카테고리 선택
          </span>
        )}
        <CatIcon name="chevron" size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="카테고리 고르기"
          onKeyDown={onKeyDown}
          className="absolute top-[calc(100%+6px)] left-0 z-20 w-70 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[0_8px_24px_var(--shadow-soft)] max-md:fixed max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:w-auto max-md:rounded-b-none"
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              <CatIcon name="search" size={16} />
            </span>
            <label htmlFor={`${id}-q`} className="sr-only">
              카테고리 검색
            </label>
            <input
              ref={search}
              id={`${id}-q`}
              // 열릴 때 바로 쓸 수 있게(목록도 보여서 안 쳐도 고를 수 있다)
              autoFocus
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1);
                setError(null);
              }}
              placeholder="검색하거나 새로 만들기"
              className="h-10 w-full rounded-full bg-muted pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:focus-ring"
            />
          </div>

          {found.length > 0 ? (
            <ul
              role="listbox"
              aria-label="카테고리"
              className="mt-1.5 max-h-49 overflow-auto"
            >
              {found.map((c, i) => (
                <li key={c.id}>
                  <div
                    className={`flex items-center gap-2 rounded-lg pr-1 pl-2.5 ${
                      i === active ? "bg-muted" : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.id === value}
                      onClick={() => pick(c.id)}
                      className="flex min-h-10 flex-1 items-center gap-2 text-left text-sm focus-visible:focus-ring"
                    >
                      <CatIcon name="folder" />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.bookmarkCount}
                      </span>
                    </button>
                    {onPin && (
                      <button
                        type="button"
                        aria-pressed={c.pinned}
                        aria-label={`${c.name} 고정${c.pinned ? " 해제" : ""}`}
                        onClick={() => onPin(c.id, !c.pinned)}
                        className={`inline-flex size-8 items-center justify-center rounded-full focus-visible:focus-ring ${
                          c.pinned ? "text-foreground" : "text-border"
                        }`}
                      >
                        <CatIcon name="pin" size={15} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-2.5 text-[13px] leading-relaxed text-muted-foreground">
              {categories.length === 0
                ? "아직 카테고리가 없어요. 이름을 넣어 첫 카테고리를 만들어 보세요."
                : "찾는 카테고리가 없어요."}
            </p>
          )}

          {creatable && (
            <button
              type="button"
              onClick={() => void create()}
              disabled={tooLong || saving}
              className="mt-1.5 flex min-h-11 w-full items-center gap-2 border-t border-border-subtle px-2.5 text-left text-sm font-semibold disabled:text-muted-foreground"
            >
              <CatIcon name="plus" size={16} />새 카테고리 “{trimmed}” 만들기
            </button>
          )}
          {(tooLong || error) && (
            <p role="alert" className="mx-2.5 mt-1.5 text-xs text-destructive">
              {error ?? NAME_INVALID_MESSAGE}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
