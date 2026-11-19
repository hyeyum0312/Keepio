"use client";

import Image from "next/image";
import { useState } from "react";
import { fallbackArtFor } from "@/shared/lib/fallback-art";
import { HomeIcon } from "./HomeIcons";

// FEAT-010: 서버가 주는 표시 제목(넣은 제목 → 페이지 제목 → 도메인)과 썸네일 주소가 있으면 쓴다
export type TriageLink = {
  id: string;
  url: string;
  title?: string | null;
  displayTitle?: string;
  // 이미지로 바로 쓸 수 있는 주소(서명 포함). 없으면 아트워크로 대신한다
  thumbnailUrl?: string | null;
};
export type TriageCategory = { id: string; name: string };

function origin(url: string) {
  return URL.parse(url)?.origin ?? url;
}

// 정리할 링크 한 줄(2026-11-19 시안): 썸네일 · 제목·주소 · [카테고리 선택] [건너뛰기] [저장].
// 썸네일이 없거나 불러오지 못하면 링크 ID로 정한 아트워크를 보여 준다(같은 링크는 늘 같은 그림).
// 카테고리 선택·저장은 카테고리 서버(FEAT-008)가 붙기 전에는 넘기지 않는다(빈 배열이면 그리지 않음)
export function TriageRow({
  link,
  categories = [],
  onSave,
  onSkip,
}: {
  link: TriageLink;
  categories?: TriageCategory[];
  onSave?: (categoryId: string) => void;
  onSkip: () => void;
}) {
  const [broken, setBroken] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const thumb =
    link.thumbnailUrl && broken !== link.thumbnailUrl
      ? link.thumbnailUrl
      : fallbackArtFor(link.id);
  const title = link.displayTitle ?? link.title ?? origin(link.url);

  return (
    <article
      aria-label="정리할 링크"
      className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-4 md:flex-row md:items-center md:gap-5 md:px-5"
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
            onError={() => setBroken(link.thumbnailUrl ?? null)}
            className="object-cover"
          />
        </span>
        <div className="min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-base font-bold hover:underline focus-visible:focus-ring"
          >
            {title}
          </a>
          <p className="truncate text-sm text-muted-foreground">
            {origin(link.url)}
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
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 shrink-0 rounded-xl bg-muted px-4 text-sm font-medium focus-visible:focus-ring"
        >
          건너뛰기
        </button>
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => categoryId && onSave?.(categoryId)}
            className="min-h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground focus-visible:focus-ring"
          >
            저장
          </button>
        )}
      </div>
    </article>
  );
}
