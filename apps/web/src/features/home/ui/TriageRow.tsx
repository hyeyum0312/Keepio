"use client";

import Image from "next/image";
import { useState } from "react";
import { fallbackArtFor } from "@/shared/lib/fallback-art";
import { FaviconTile } from "@/shared/ui/FaviconTile";
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
};
export type TriageCategory = { id: string; name: string };

function origin(url: string) {
  return URL.parse(url)?.origin ?? url;
}

// 최근 추가한 링크 한 줄(2026-11-21 시안, 옛 "정리할 링크"): 썸네일 · 제목·주소 · [카테고리 선택] [저장] [건너뛰기].
// 카테고리가 하나도 없으면 [+ 카테고리 만들기] [저장] [건너뛰기]. 이미 카테고리를 정한 링크는 그 카테고리가 골라진 채로 보인다.
// 썸네일이 없거나 불러오지 못하면 링크 ID로 정한 아트워크를 보여 준다(같은 링크는 늘 같은 그림).
// 카테고리 선택·저장은 카테고리 서버(FEAT-008)가 붙기 전에는 넘기지 않는다(빈 배열이면 그리지 않음).
// createCategory: 카테고리가 0개일 때 [+ 카테고리 만들기](FEAT-008 AC-13). 만들기와 그때의 저장은
// 카테고리 서버가 붙을 때 연결한다(그 전에는 "준비 중")
export function TriageRow({
  link,
  categories = [],
  createCategory = false,
  onSave,
  onSkip,
}: {
  link: TriageLink;
  categories?: TriageCategory[];
  createCategory?: boolean;
  onSave?: (categoryId: string) => void;
  onSkip: () => void;
}) {
  const [broken, setBroken] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
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
          <p className="truncate text-sm text-muted-foreground">
            {link.meta ?? origin(link.url)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {categories.length > 0 && (
          <span className="relative inline-flex">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              <HomeIcon name="folder" />
            </span>
            <label htmlFor={`triage-cat-${link.id}`} className="sr-only">
              카테고리
            </label>
            <select
              id={`triage-cat-${link.id}`}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="min-h-11 appearance-none rounded-xl border border-border-subtle bg-surface pr-9 pl-9 text-sm font-medium focus-visible:focus-ring"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
              <HomeIcon name="chevron" size={16} />
            </span>
          </span>
        )}
        {categories.length === 0 && createCategory && (
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
        )}
        {categories.length > 0 ? (
          <button
            type="button"
            onClick={() => categoryId && onSave?.(categoryId)}
            className="min-h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:focus-ring"
          >
            저장
          </button>
        ) : (
          createCategory && (
            // 고를 카테고리가 없어 아직 저장할 것이 없다(카테고리 서버 전까지 준비 중)
            <button
              type="button"
              aria-disabled="true"
              title="준비 중"
              className="min-h-11 shrink-0 cursor-default rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground opacity-50 focus-visible:focus-ring"
            >
              저장
              <span className="sr-only"> (준비 중)</span>
            </button>
          )
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
