"use client";

import { apiUrl } from "@keepio/api-client";
import { useState, useSyncExternalStore } from "react";
import { SaveLinkCard, useBookmarkPages } from "@/features/bookmarks";
import {
  useApplyCategory,
  useCategories,
  useCreateCategoryAndApply,
} from "@/features/categories";
import {
  SAMPLE_BUCKETS,
  SAMPLE_PAGES,
  SAMPLE_TRIAGE,
} from "../lib/sample-data";
import { useTriageQueue } from "../model/useTriageQueue";
import { HomeView } from "./HomeView";
import { MobileAddLink } from "./MobileAddLink";
import { type TriageLink, TriageRow } from "./TriageRow";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribeWidth(onChange: () => void) {
  const media = window.matchMedia?.(MOBILE_QUERY);
  media?.addEventListener?.("change", onChange);
  return () => media?.removeEventListener?.("change", onChange);
}

function isMobile() {
  return !!window.matchMedia?.(MOBILE_QUERY).matches;
}

// 실제 홈. "최근 추가한 링크"는 최근에 저장한 링크를 한 장씩 보여 주고 카테고리를 정하게 한다(2026-11-21, 옛 "정리할 링크").
// 카테고리를 정한 링크도 목록에 남고, 고르기에 그 카테고리가 골라진 채로 보인다(D-19).
// 버킷·공유용 링크는 각 서버 기능이 붙을 때 채운다. 그 전에는 그리지 않는다.
// 링크가 하나도 없으면 예시(최근 추가한 링크 1장·버킷 3개·공유용 링크 2개)로 채우고, 첫 링크를 저장하면 예시는 사라진다.
// 링크 저장: PC는 맨 위 저장 카드, 모바일은 + 버튼과 시트. 사이드바 "링크 추가"(/?save=1)는 모바일이면 시트를 연 채로 시작한다
export function Home({ openSave = false }: { openSave?: boolean }) {
  const pages = useBookmarkPages("active");
  const categories = useCategories();
  const createAndApply = useCreateCategoryAndApply();
  const applyCategory = useApplyCategory();
  // 화면 폭은 브라우저에서만 안다(서버 렌더에서는 PC로 본다)
  const mobile = useSyncExternalStore(subscribeWidth, isMobile, () => false);
  // 사용자가 열고 닫기 전에는 /?save=1 + 모바일이면 열린 채로 시작한다
  const [sheet, setSheet] = useState<boolean | null>(null);
  const sheetOpen = sheet ?? (openSave && mobile);
  const items: TriageLink[] = (
    pages.data?.pages.flatMap((p) => p.items) ?? []
  ).map((b) => ({
    id: b.id,
    url: b.url,
    title: b.title,
    displayTitle: b.displayTitle,
    thumbnailUrl:
      b.thumbnail.status === "ready" && b.thumbnail.url
        ? apiUrl(b.thumbnail.url)
        : null,
    thumbnailFallbackUrl: b.thumbnail.sourceUrl,
    faviconUrl: b.faviconUrl,
    categoryId: b.categoryId,
  }));
  const queue = useTriageQueue(items);
  // 모든 페이지를 받았을 때만 개수를 보여 준다(일부로 세지 않는다)
  const exactCount =
    pages.data && !pages.hasNextPage ? queue.remaining : undefined;
  const showSample =
    pages.data !== undefined && !pages.hasNextPage && items.length === 0;

  return (
    <HomeView
      sample={showSample}
      // 시트가 열린 동안에는 같은 폼이 두 개가 되지 않게 PC 카드를 뺀다(시트는 모바일에서만 열린다)
      savePanel={sheetOpen ? undefined : <SaveLinkCard />}
      mobileAdd={
        <MobileAddLink
          open={sheetOpen}
          onOpenChange={setSheet}
          tip={showSample}
        />
      }
      triage={
        showSample ? (
          <TriageRow link={SAMPLE_TRIAGE} createCategory onSkip={() => {}} />
        ) : queue.current ? (
          <TriageRow
            createCategory
            link={queue.current}
            categories={categories.data?.items ?? []}
            onCreate={(name) => createAndApply(queue.current!.id, name)}
            onSave={(categoryId) => {
              const id = queue.current!.id;
              void applyCategory(id, categoryId);
              queue.skip(id);
            }}
            onSkip={() => queue.skip(queue.current!.id)}
          />
        ) : null
      }
      triageCount={exactCount}
      buckets={showSample ? SAMPLE_BUCKETS : []}
      pages={showSample ? SAMPLE_PAGES : []}
    />
  );
}
