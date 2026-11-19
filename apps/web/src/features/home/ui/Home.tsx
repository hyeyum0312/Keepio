"use client";

import { apiUrl } from "@keepio/api-client";
import Link from "next/link";
import { SaveBookmarkForm, useBookmarkPages } from "@/features/bookmarks";
import { useTriageQueue } from "../model/useTriageQueue";
import { HomeView } from "./HomeView";
import { type TriageLink, TriageRow } from "./TriageRow";

// 실제 홈. 지금 서버에 있는 것은 링크 목록뿐이라 카테고리가 없는 링크 = 정리할 링크다(D-02).
// 카테고리 선택·버킷·공유한 페이지는 각 서버 기능(FEAT-008 등)이 붙을 때 채운다. 그 전에는 그리지 않는다
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
  }));
  const queue = useTriageQueue(items);
  // 모든 페이지를 받았을 때만 개수를 보여 준다(일부로 세지 않는다)
  const exactCount =
    pages.data && !pages.hasNextPage ? queue.remaining : undefined;

  return (
    <HomeView
      savePanel={
        openSave ? (
          <section
            aria-label="링크 저장"
            className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">링크 저장</h2>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:focus-ring"
              >
                닫기
              </Link>
            </div>
            <SaveBookmarkForm />
          </section>
        ) : undefined
      }
      triage={
        queue.current ? (
          <TriageRow
            link={queue.current}
            onSkip={() => queue.skip(queue.current!.id)}
          />
        ) : null
      }
      triageCount={exactCount}
      buckets={[]}
      pages={[]}
    />
  );
}
