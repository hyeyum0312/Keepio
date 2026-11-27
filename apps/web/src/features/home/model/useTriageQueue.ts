"use client";

import { useState } from "react";

// 최근 추가한 링크(옛 정리할 링크)를 한 장씩 보여 준다. 건너뛴 링크는 미분류로 남고, 이번 방문(화면을 떠나기 전)에는 다시 나오지 않는다(FEAT-009).
// 보고 있는 링크는 건너뛰거나 저장할 때까지 그 자리에 둔다: 카테고리를 만들어 적용하면 목록을 다시 받으며
// 순서(미분류 먼저)가 바뀌는데, 그때 다른 링크로 넘어가지 않고 골라진 카테고리를 그대로 보여 준다
export function useTriageQueue<T extends { id: string }>(items: T[]) {
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [shownId, setShownId] = useState<string | null>(null);
  const remaining = items.filter((item) => !skipped.has(item.id));
  const current =
    remaining.find((item) => item.id === shownId) ?? remaining[0] ?? null;
  // 렌더 중 이전 값 기억하기(React 권장 방식). 바뀔 때만 다시 그린다
  if ((current?.id ?? null) !== shownId) setShownId(current?.id ?? null);
  return {
    current,
    remaining: remaining.length,
    skip: (id: string) => setSkipped((prev) => new Set(prev).add(id)),
  };
}
