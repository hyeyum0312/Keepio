"use client";

import { useBookmarksControllerRemove } from "@keepio/api-client";
import { useEffect, useRef, useState } from "react";
import {
  type CategoryChip,
  CategoryChips,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useSetCategoryPinned,
} from "@/features/categories";
import { submit } from "@/shared/lib/server-message";
import {
  type BookmarkFilter,
  useBookmarkPages,
  useInvalidateBookmarkLists,
} from "../model/useBookmarkPages";
import { BookmarkList, type ListView } from "./BookmarkList";
import { LinkIcon } from "./LinkIcons";
import { SaveLinkCard } from "./SaveLinkCard";
import { SelectionBar } from "./SelectionBar";

const VIEWS: { view: ListView; label: string; icon: "list" | "grid" }[] = [
  { view: "list", label: "목록으로 보기", icon: "list" },
  { view: "grid", label: "카드로 보기", icon: "grid" },
];
// 여러 개 삭제 때 한꺼번에 보내는 요청 수(FEAT-011 AC-09)
const DELETE_CONCURRENCY = 4;

// 내 링크(LINK-01): 저장 카드 → 카테고리 칩 줄(CAT-01) → 고른 칩 이름의 목록(목록형/카드형).
// 칩은 전체 · 미분류 · 카테고리들. 거르기는 서버(FEAT-008 AC-11). 고른 칩 이름이 목록 제목이 된다.
// 보기 방식·고른 칩·고른 링크는 화면 상태라 새로고침하면 사라진다. 칩을 바꾸면 고른 링크를 푼다.
// FEAT-011 AC-06~10: 썸네일 안 체크박스로 고르고, 하나라도 고르면 아래 작업 막대. 모바일은 "선택"으로 선택 모드.
// 검색·정렬·태그 필터·버킷 지정은 서버(검색)가 생기면 붙인다
export function AllLinks() {
  const [view, setView] = useState<ListView>("list");
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const setPinned = useSetCategoryPinned();
  const [chosen, setChosen] = useState<CategoryChip>({ kind: "all" });
  const categoryList = categories.data?.items ?? [];
  // 고른 카테고리가 사라지면(다른 화면에서 삭제 등) 전체로 본다
  const chip: CategoryChip =
    chosen.kind === "category" &&
    categories.data &&
    !categoryList.some((c) => c.id === chosen.id)
      ? { kind: "all" }
      : chosen;
  const filter = chipFilter(chip);
  const title =
    chip.kind === "all"
      ? "전체"
      : chip.kind === "uncategorized"
        ? "미분류"
        : (categoryList.find((c) => c.id === chip.id)?.name ?? "전체");
  const pages = useBookmarkPages("active", filter);
  const remove = useBookmarksControllerRemove();
  const invalidate = useInvalidateBookmarkLists();
  const [picked, setPicked] = useState<string[]>([]);
  const [mobileMode, setMobileMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const allBox = useRef<HTMLInputElement>(null);

  const ids = pages.data?.pages.flatMap((p) => p.items.map((b) => b.id)) ?? [];
  // 다시 불러온 목록에 없는 링크(삭제됨 등)는 선택에서 빠진다(AC-10)
  const selected = picked.filter((id) => ids.includes(id));
  const selecting = mobileMode || selected.length > 0;
  const all = ids.length > 0 && selected.length === ids.length;
  const some = selected.length > 0 && !all;

  useEffect(() => {
    if (allBox.current) allBox.current.indeterminate = some;
  }, [some]);

  function clear() {
    setPicked([]);
    setMobileMode(false);
  }

  // Esc로 선택을 푼다(입력칸·메뉴의 Esc는 각자 먼저 처리한다)
  useEffect(() => {
    if (selected.length === 0) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (e.key !== "Escape" || target?.tagName === "INPUT") return;
      setPicked([]);
      setMobileMode(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected.length]);

  function toggle(id: string, checked: boolean) {
    setResult(null);
    setPicked((list) =>
      checked
        ? [...list.filter((x) => x !== id), id]
        : list.filter((x) => x !== id),
    );
  }

  function toggleAll(checked: boolean) {
    setResult(null);
    setPicked(checked ? ids : []);
  }

  // AC-09. 고른 링크를 휴지통으로(기존 삭제 API를 4개씩). 실패한 것은 고른 채로 둔다
  async function deleteSelected() {
    const targets = [...selected];
    setDeleting(true);
    setResult(null);
    const failed: string[] = [];
    for (let i = 0; i < targets.length; i += DELETE_CONCURRENCY) {
      const chunk = targets.slice(i, i + DELETE_CONCURRENCY);
      const results = await Promise.all(
        chunk.map((id) =>
          submit(
            () => remove.mutateAsync({ id }),
            (res) => res.status === 204,
          ),
        ),
      );
      results.forEach((r, j) => {
        if (!r.ok) failed.push(chunk[j]);
      });
    }
    const moved = targets.length - failed.length;
    setPicked(failed);
    if (failed.length === 0) setMobileMode(false);
    setResult(
      [
        moved > 0 ? `${moved}개를 휴지통으로 옮겼어요.` : "",
        failed.length > 0
          ? `${failed.length}개는 옮기지 못했어요. 다시 시도해 주세요.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    setDeleting(false);
    await invalidate();
  }

  return (
    <div className="flex flex-col gap-10">
      <SaveLinkCard />

      <section aria-labelledby="links-list" className="flex flex-col gap-4">
        <CategoryChips
          categories={categoryList}
          totalCount={categories.data?.totalCount}
          uncategorizedCount={categories.data?.uncategorizedCount}
          value={chip}
          onChange={(next) => {
            setChosen(next);
            clear();
            setResult(null);
          }}
          onCreate={createCategory}
          onDelete={deleteCategory}
          onPin={setPinned}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            {/* 모두 선택: PC는 늘, 모바일은 선택 모드에서만. 고를 링크가 0개면 그리지 않는다 */}
            {ids.length > 0 && (
              <label
                className={`relative size-11 shrink-0 cursor-pointer items-center justify-center ${
                  selecting ? "flex" : "hidden md:flex"
                }`}
              >
                <input
                  ref={allBox}
                  type="checkbox"
                  checked={all}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="이 화면의 링크 모두 선택"
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="kp-thumb-check size-[22px] rounded-[7px] shadow-none! peer-focus-visible:focus-ring"
                />
              </label>
            )}
            <h2
              id="links-list"
              className="truncate text-base font-bold tracking-tight"
            >
              <span className={selecting ? "hidden md:inline" : ""}>
                {title}
              </span>
              {selecting && (
                <span className="md:hidden">{selected.length}개 선택</span>
              )}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(ids.length > 0 || selecting) && (
              <button
                type="button"
                onClick={() => (selecting ? clear() : setMobileMode(true))}
                className="min-h-11 rounded-lg px-3 text-sm font-semibold focus-visible:focus-ring md:hidden"
              >
                {selecting ? "완료" : "선택"}
              </button>
            )}
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
        </div>
        <p
          role="status"
          className={result ? "text-sm text-muted-foreground" : "sr-only"}
        >
          {result}
        </p>
        <BookmarkList
          status="active"
          view={view}
          filter={filter}
          emptyMessage={
            chip.kind === "all"
              ? undefined
              : chip.kind === "uncategorized"
                ? "미분류 링크가 없어요."
                : "이 카테고리에 링크가 없어요."
          }
          selection={{ selected, onToggle: toggle, always: selecting }}
        />
        {selecting && (
          <SelectionBar
            count={selected.length}
            showPc={selected.length > 0}
            deleting={deleting}
            onDelete={() => void deleteSelected()}
            onClear={clear}
          />
        )}
      </section>
    </div>
  );
}

function chipFilter(chip: CategoryChip): BookmarkFilter {
  if (chip.kind === "uncategorized") return { uncategorized: true };
  if (chip.kind === "category") return { categoryId: chip.id };
  return {};
}
