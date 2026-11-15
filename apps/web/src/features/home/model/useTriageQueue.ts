"use client";

import { useState } from "react";

// 정리할 링크를 한 장씩 보여 준다. 건너뛴 링크는 미분류로 남고, 이번 방문(화면을 떠나기 전)에는 다시 나오지 않는다(FEAT-009)
export function useTriageQueue<T extends { id: string }>(items: T[]) {
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const remaining = items.filter((item) => !skipped.has(item.id));
  return {
    current: remaining[0] ?? null,
    remaining: remaining.length,
    skip: (id: string) => setSkipped((prev) => new Set(prev).add(id)),
  };
}
