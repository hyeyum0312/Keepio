"use client";

import { apiUrl } from "@keepio/api-client";
import Link from "next/link";
import { SaveLinkCard, useBookmarkPages } from "@/features/bookmarks";
import { SAMPLE_BUCKETS, SAMPLE_TRIAGE } from "../lib/sample-data";
import { useTriageQueue } from "../model/useTriageQueue";
import { HomeView } from "./HomeView";
import { type TriageLink, TriageRow } from "./TriageRow";

// 실제 홈. 지금 서버에 있는 것은 링크 목록뿐이라 카테고리가 없는 링크 = 정리할 링크다(D-02).
// 카테고리 선택·버킷·공유한 페이지는 각 서버 기능(FEAT-008 등)이 붙을 때 채운다. 그 전에는 그리지 않는다.
// 링크가 하나도 없으면 예시(정리할 링크 1장·버킷 3개)로 채운다. 맨 위에 링크 저장을 열어 두고, 첫 링크를 저장하면 예시는 사라진다
export function Home({ openSave = false }: { openSave?: boolean }) {
  const pages = useBookmarkPages("active");
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
  }));
  const queue = useTriageQueue(items);
  // 모든 페이지를 받았을 때만 개수를 보여 준다(일부로 세지 않는다)
  const exactCount =
    pages.data && !pages.hasNextPage ? queue.remaining : undefined;
  const showSample =
    pages.data !== undefined && !pages.hasNextPage && items.length === 0;

  return (
    <HomeView
      savePanel={
        openSave || showSample ? (
          <SaveLinkCard
            note={
              showSample
                ? "아래는 예시예요. 첫 링크를 저장하면 예시는 사라지고 내 링크로 채워져요."
                : undefined
            }
            action={
              openSave && !showSample ? (
                <Link
                  href="/"
                  className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:focus-ring"
                >
                  닫기
                </Link>
              ) : undefined
            }
          />
        ) : undefined
      }
      triage={
        showSample ? (
          <TriageRow link={SAMPLE_TRIAGE} onSkip={() => {}} />
        ) : queue.current ? (
          <TriageRow
            link={queue.current}
            onSkip={() => queue.skip(queue.current!.id)}
          />
        ) : null
      }
      triageCount={exactCount}
      buckets={showSample ? SAMPLE_BUCKETS : []}
      pages={[]}
    />
  );
}
