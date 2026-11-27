"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { fallbackArtFor } from "@/shared/lib/fallback-art";
import { FaviconTile } from "@/shared/ui/FaviconTile";
import { CategoryPicker } from "@/features/categories";
import { HomeIcon } from "./HomeIcons";

// FEAT-010: 서버가 주는 표시 제목(넣은 제목 → 페이지 제목 → 도메인)과 썸네일 주소가 있으면 쓴다
export type TriageLink = {
  id: string;
  url: string;
  title?: string | null;
  displayTitle?: string;
  // 이미지로 바로 쓸 수 있는 주소(서명 포함). 없으면 아트워크로 대신한다
  thumbnailUrl?: string | null;
  // 보관 파일을 못 쓸 때 불러 볼 링크 페이지의 원본 이미지(FEAT-010 AC-11)
  thumbnailFallbackUrl?: string | null;
  // 주소 대신 보여 줄 보조 문구(예시 카드의 안내)
  meta?: string;
  // FEAT-010 AC-15. 썸네일이 없을 때 아트워크 위에 올릴 사이트 아이콘
  faviconUrl?: string | null;
  // FEAT-008. 이미 정한 카테고리(null이면 미분류). 고르기에 이 값이 골라진 채로 보인다(D-19)
  categoryId?: string | null;
  // FEAT-010. 태그 칩(내 링크와 같은 모양). 홈은 카테고리 고르기가 따로 있어 태그만 보여 준다
  tags?: { id: string; name: string }[];
};
// 고르기 부품이 쓰는 모양(서버가 준 순서·링크 수·고정을 그대로 넘긴다)
export type TriageCategory = {
  id: string;
  name: string;
  bookmarkCount: number;
  pinned: boolean;
};

function origin(url: string) {
  return URL.parse(url)?.origin ?? url;
}

// 최근 추가한 링크 한 줄(2026-11-21 시안, 옛 "정리할 링크"): 썸네일 · 제목·주소 · [카테고리 선택] [저장] [건너뛰기].
// 카테고리가 하나도 없으면 [+ 카테고리 만들기] [저장] [건너뛰기]. 이미 카테고리를 정한 링크는 그 카테고리가 골라진 채로 보인다(D-19).
// 썸네일이 없거나 불러오지 못하면 링크 ID로 정한 아트워크를 보여 준다(같은 링크는 늘 같은 그림).
// FEAT-008 AC-13: 카테고리가 하나라도 있으면 고르기 부품(검색 + 목록 + 맨 아래 만들기)을 쓴다.
// 카테고리가 0개면 고를 것이 없으므로 줄에서 바로 [카테고리 만들기] → 입력칸으로 만든다(Enter·[저장]).
// onCreate가 없으면(카테고리 서버 전) 만들기·저장은 "준비 중"으로 둔다
const NAME_INVALID_MESSAGE = "카테고리 이름은 1~20자로 입력해 주세요.";
const MAX_CATEGORY_LENGTH = 20;

export function TriageRow({
  link,
  categories = [],
  createCategory = false,
  onSave,
  onCreate,
  onPin,
  onSkip,
}: {
  link: TriageLink;
  categories?: TriageCategory[];
  createCategory?: boolean;
  onSave?: (categoryId: string) => void;
  // 이름으로 카테고리를 만들고 이 링크에 적용한다. 서버 문구를 돌려주면 입력칸 아래에 보여 준다
  onCreate?: (name: string) => Promise<string | null>;
  // 고르기 목록에서 바로 고정·해제(FEAT-008 AC-15)
  onPin?: (categoryId: string, pinned: boolean) => void;
  onSkip: () => void;
}) {
  const [broken, setBroken] = useState<string[]>([]);
  // 고르기 전에는 비어 있다(자동으로 첫 카테고리를 고르지 않는다). 이미 정한 링크는 그 값으로 시작
  const [categoryId, setCategoryId] = useState<string | null>(
    link.categoryId ?? null,
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameBox = useRef<HTMLInputElement>(null);
  const trimmed = name.trim();
  const tooLong = trimmed.length > MAX_CATEGORY_LENGTH;
  const canCreate = trimmed.length > 0 && !tooLong && !saving;
  useEffect(() => {
    if (creating) nameBox.current?.focus();
  }, [creating]);

  function startCreating() {
    setCreating(true);
    setName("");
    setError(null);
  }

  async function submitName() {
    if (!onCreate || !canCreate) return;
    setSaving(true);
    const message = await onCreate(trimmed);
    setSaving(false);
    if (message) {
      setError(message);
      nameBox.current?.focus();
      return;
    }
    setCreating(false);
    setName("");
  }

  const source = [link.thumbnailUrl, link.thumbnailFallbackUrl].find(
    (s): s is string => !!s && !broken.includes(s),
  );
  const thumb = source ?? fallbackArtFor(link.id);
  const title = link.displayTitle ?? link.title ?? origin(link.url);

  return (
    <article
      aria-label="최근 추가한 링크"
      className="flex flex-col gap-4 rounded-[20px] bg-surface p-3.5 shadow-[0_1px_2px_var(--shadow-soft),0_8px_24px_var(--shadow-soft)] md:flex-row md:items-center md:gap-4 md:px-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            key={thumb}
            src={thumb}
            alt=""
            fill
            sizes="112px"
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => {
              if (source) setBroken((b) => [...b, source]);
            }}
            className="object-cover"
          />
          {!source && (
            <FaviconTile
              faviconUrl={link.faviconUrl}
              pageUrl={link.url}
              size="sm"
            />
          )}
        </span>
        <div className="min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-bold hover:underline focus-visible:focus-ring"
          >
            {title}
          </a>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {link.meta ?? origin(link.url)}
          </p>
          {/* 분류 줄(2026-11-22): 태그가 없으면 그리지 않는다 */}
          {!!link.tags?.length && (
            <ul
              aria-label="태그"
              className="mt-1.5 flex flex-wrap items-center gap-1.5"
            >
              {link.tags.map((t) => (
                <li
                  key={t.id}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                >
                  #{t.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:items-start">
        {creating ? (
          // FEAT-008 AC-13 만드는 중: 입력칸 + [취소] [저장]. Enter면 저장, Esc면 취소
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <label htmlFor={`triage-new-cat-${link.id}`} className="sr-only">
                새 카테고리 이름
              </label>
              <input
                ref={nameBox}
                id={`triage-new-cat-${link.id}`}
                type="text"
                value={name}
                placeholder="카테고리 이름"
                aria-invalid={tooLong || !!error ? true : undefined}
                aria-describedby={
                  tooLong || error ? `triage-new-cat-err-${link.id}` : undefined
                }
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitName();
                  }
                  if (e.key === "Escape") setCreating(false);
                }}
                className="min-h-11 min-w-0 flex-1 kp-field text-sm"
              />
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-muted-foreground focus-visible:focus-ring"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void submitName()}
                disabled={!canCreate}
                className="min-h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:focus-ring disabled:bg-muted disabled:text-muted-foreground"
              >
                저장
              </button>
            </div>
            {(tooLong || error) && (
              <p
                id={`triage-new-cat-err-${link.id}`}
                role="alert"
                className="text-xs text-destructive"
              >
                {error ?? NAME_INVALID_MESSAGE}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <CategoryPicker
                value={categoryId}
                categories={categories}
                onSelect={setCategoryId}
                onCreate={onCreate}
                onPin={onPin}
              />
            )}
            {categories.length === 0 &&
              createCategory &&
              (onCreate ? (
                <button
                  type="button"
                  onClick={startCreating}
                  className="inline-flex min-h-11 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/60 px-3.5 text-sm font-medium focus-visible:focus-ring md:flex-none"
                >
                  <HomeIcon name="plus" size={16} />
                  카테고리 만들기
                </button>
              ) : (
                <button
                  type="button"
                  aria-disabled="true"
                  title="준비 중"
                  className="inline-flex min-h-11 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/60 px-3.5 text-sm font-medium focus-visible:focus-ring md:flex-none"
                >
                  <HomeIcon name="plus" size={16} />
                  카테고리 만들기
                  <span className="sr-only">(준비 중)</span>
                </button>
              ))}
            {categories.length > 0 ? (
              // 고른 카테고리가 없으면 저장할 것이 없다(시안 ①)
              <button
                type="button"
                onClick={() => categoryId && onSave?.(categoryId)}
                aria-disabled={categoryId ? undefined : "true"}
                title={categoryId ? undefined : "카테고리를 골라 주세요"}
                className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-semibold focus-visible:focus-ring ${
                  categoryId
                    ? "bg-primary text-primary-foreground"
                    : "cursor-default bg-muted text-muted-foreground"
                }`}
              >
                저장
              </button>
            ) : (
              createCategory && (
                // 고를 카테고리가 없어 아직 저장할 것이 없다(먼저 만들어야 한다)
                <button
                  type="button"
                  aria-disabled="true"
                  title={onCreate ? "카테고리를 먼저 만들어 주세요" : "준비 중"}
                  className="min-h-11 shrink-0 cursor-default rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground opacity-50 focus-visible:focus-ring"
                >
                  저장
                  {!onCreate && <span className="sr-only"> (준비 중)</span>}
                </button>
              )
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 shrink-0 rounded-xl bg-muted px-4 text-sm font-medium focus-visible:focus-ring"
        >
          건너뛰기
        </button>
      </div>
    </article>
  );
}
