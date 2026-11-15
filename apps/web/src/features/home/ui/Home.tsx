"use client";

import { SaveBookmarkForm, useBookmarkPages } from "@/features/bookmarks";
import { useState } from "react";
import { buttonClass } from "@/shared/ui/FormParts";
import { useTriageQueue } from "../model/useTriageQueue";
import { HomeView } from "./HomeView";
import { TriageRow } from "./TriageRow";

// 실제 홈. 지금 서버에 있는 것은 링크 목록뿐이라 카테고리가 없는 링크 = 정리할 링크다(D-02).
// 카테고리 칩·버킷·공유한 페이지는 각 서버 기능(FEAT-008 등)이 붙을 때 채운다. 그 전에는 섹션을 그리지 않는다
export function Home({ openSave = false }: { openSave?: boolean }) {
  const pages = useBookmarkPages("active");
  const items = pages.data?.pages.flatMap((p) => p.items) ?? [];
  const queue = useTriageQueue(items);
  const [saving, setSaving] = useState(openSave);
  // 모든 페이지를 받았을 때만 개수를 보여 준다(일부로 세지 않는다)
  const exactCount =
    pages.data && !pages.hasNextPage ? queue.remaining : undefined;

  return (
    <HomeView
      saveButton={
        <button
          type="button"
          onClick={() => setSaving((v) => !v)}
          aria-expanded={saving}
          className={`${buttonClass.primary} w-auto! shrink-0 px-5`}
        >
          + 링크 저장
        </button>
      }
      savePanel={saving ? <SaveBookmarkForm /> : undefined}
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
