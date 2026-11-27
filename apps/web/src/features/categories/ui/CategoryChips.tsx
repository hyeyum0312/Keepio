"use client";

import { useId, useRef, useState } from "react";
import type { CreateCategoryResult } from "../model/useCategories";
import { CatIcon } from "./CatIcons";
import { CategoryManage } from "./CategoryManage";

export type ChipCategory = {
  id: string;
  name: string;
  bookmarkCount: number;
  pinned: boolean;
};

// 고른 칩: 전체 · 미분류 · 카테고리 하나
export type CategoryChip =
  | { kind: "all" }
  | { kind: "uncategorized" }
  | { kind: "category"; id: string };

// 서버와 같은 기준(FEAT-008 AC-02). 넘으면 입력칸 오류 상태로 [저장]을 막는다(07-BRAND §6)
const MAX_CATEGORY_LENGTH = 20;
const NAME_INVALID_MESSAGE = "카테고리 이름은 1~20자로 입력해 주세요.";

// CAT-01 칩 줄(내 링크 목록 위): 전체 · 미분류는 늘 맨 앞, 그다음은 서버가 정한 순서(고정 → 한글 → 영문 → 숫자 → 그 밖, AC-14).
// 칩마다 이름 + 링크 수(서버 값). 고른 칩은 잉크 배경. 줄 끝 + 카테고리(점선)는 이름을 넣어 만들고 그 칩을 고른다.
// 그 뒤 [관리]는 관리 모달(고정·삭제)을 연다. 카테고리가 없으면 [관리]를 그리지 않는다. 닫으면 [관리]로 포커스를 돌린다
export function CategoryChips({
  categories,
  totalCount,
  uncategorizedCount,
  value,
  onChange,
  onCreate,
  onDelete,
  onPin,
}: {
  categories: ChipCategory[];
  totalCount?: number;
  uncategorizedCount?: number;
  value: CategoryChip;
  onChange: (chip: CategoryChip) => void;
  onCreate?: (name: string) => Promise<CreateCategoryResult>;
  // 관리 모달. 실패하면 서버 문구
  onDelete?: (categoryId: string) => Promise<string | null>;
  onPin?: (categoryId: string, pinned: boolean) => Promise<string | null>;
}) {
  const id = useId();
  const [managing, setManaging] = useState(false);
  const manageButton = useRef<HTMLButtonElement>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const tooLong = trimmed.length > MAX_CATEGORY_LENGTH;
  const canSave = trimmed.length > 0 && !tooLong && !saving;
  const shownError = tooLong ? NAME_INVALID_MESSAGE : error;

  function closeCreate() {
    setCreating(false);
    setName("");
    setError(null);
  }

  async function save() {
    if (!onCreate || !canSave) return;
    setSaving(true);
    const result = await onCreate(trimmed);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    closeCreate();
    // 만든(또는 같은 이름으로 이미 있던) 카테고리를 고른다
    onChange({ kind: "category", id: result.categoryId });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="group"
        aria-label="카테고리"
        className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5"
      >
        <Chip
          label="전체"
          count={totalCount}
          pressed={value.kind === "all"}
          onClick={() => onChange({ kind: "all" })}
        />
        <Chip
          label="미분류"
          count={uncategorizedCount}
          pressed={value.kind === "uncategorized"}
          onClick={() => onChange({ kind: "uncategorized" })}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            count={c.bookmarkCount}
            pressed={value.kind === "category" && value.id === c.id}
            onClick={() => onChange({ kind: "category", id: c.id })}
          />
        ))}
        {onCreate &&
          (creating ? (
            <span className="flex shrink-0 items-center gap-1.5">
              <label htmlFor={`${id}-new`} className="sr-only">
                새 카테고리 이름
              </label>
              <input
                id={`${id}-new`}
                autoFocus
                type="text"
                value={name}
                placeholder="카테고리 이름"
                disabled={saving}
                aria-invalid={shownError ? true : undefined}
                aria-describedby={shownError ? `${id}-err` : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void save();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeCreate();
                  }
                }}
                className="min-h-11 w-40 kp-field text-sm"
              />
              <button
                type="button"
                onClick={closeCreate}
                disabled={saving}
                className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-muted-foreground focus-visible:focus-ring"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!canSave}
                className="min-h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:focus-ring disabled:bg-muted disabled:text-muted-foreground"
              >
                저장
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-dashed border-muted-foreground/60 px-4 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:focus-ring"
            >
              <CatIcon name="plus" size={16} />
              카테고리
            </button>
          ))}
        {onDelete && categories.length > 0 && (
          <button
            ref={manageButton}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={managing}
            onClick={() => setManaging(true)}
            className="min-h-11 shrink-0 rounded-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:focus-ring"
          >
            관리
          </button>
        )}
      </div>
      {managing && onDelete && (
        <CategoryManage
          categories={categories}
          onDelete={async (categoryId) => {
            const message = await onDelete(categoryId);
            // 보던 칩이 사라지면 전체로
            if (
              !message &&
              value.kind === "category" &&
              value.id === categoryId
            ) {
              onChange({ kind: "all" });
            }
            return message;
          }}
          onPin={onPin}
          onClose={() => {
            setManaging(false);
            manageButton.current?.focus();
          }}
        />
      )}
      {creating && shownError && (
        <p id={`${id}-err`} role="alert" className="text-xs text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count?: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap focus-visible:focus-ring ${
        pressed
          ? "bg-primary text-primary-foreground"
          : "border border-border-subtle bg-surface text-foreground hover:bg-muted"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={
            pressed
              ? "text-xs text-primary-foreground/80"
              : "text-xs text-muted-foreground"
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}
