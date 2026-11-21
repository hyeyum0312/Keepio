"use client";

import {
  PREVIEW_BUCKETS,
  PREVIEW_CATEGORIES,
  PREVIEW_LINKS,
  PREVIEW_PAGES,
} from "../lib/preview-data";
import { useTriageQueue } from "../model/useTriageQueue";
import { useState } from "react";
import { HomeView } from "./HomeView";
import { MobileAddLink } from "./MobileAddLink";
import { TriageRow } from "./TriageRow";

// 디자인 미리보기 전용 홈(샘플 데이터). 저장하거나 건너뛰면 다음 카드로 넘어가는 것까지 확인할 수 있다
export function HomePreview() {
  const queue = useTriageQueue(PREVIEW_LINKS);
  const next = () => queue.current && queue.skip(queue.current.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <HomeView
      mobileAdd={<MobileAddLink open={sheetOpen} onOpenChange={setSheetOpen} />}
      triage={
        queue.current ? (
          <TriageRow
            key={queue.current.id}
            link={queue.current}
            categories={PREVIEW_CATEGORIES}
            onSave={next}
            onSkip={next}
          />
        ) : null
      }
      triageCount={queue.remaining}
      buckets={PREVIEW_BUCKETS}
      pages={PREVIEW_PAGES}
    />
  );
}
