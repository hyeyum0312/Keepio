"use client";

import {
  bookmarksControllerList,
  getBookmarksControllerListQueryKey,
  getCategoriesControllerListQueryKey,
} from "@keepio/api-client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

export type BookmarkStatus = "active" | "deleted";

// 서버가 준 오류 문구를 담는다(ADR-009). 요청 자체가 실패한 경우(fetch throw)와 구분하려고 따로 둔다
export class ServerMessageError extends Error {}

// 썸네일을 가져오는 중인 항목이 보이면 3초마다 다시 받는다. 모두 끝나면 멈춘다(FEAT-010 AC-04)
const THUMBNAIL_POLL_MS = 3000;

// FEAT-008 AC-11 목록 필터(내 링크 칩 줄). 판정은 서버가 한다. 둘 다 없으면 전체
export type BookmarkFilter =
  | { categoryId: string; uncategorized?: never }
  | { uncategorized: true; categoryId?: never }
  | Record<string, never>;

// FEAT-002 AC-10·12. 커서 페이지 목록. 키는 생성 키(status·필터 포함), stale 기본값.
// 폴링은 썸네일 pending이 있을 때만(FEAT-010).
// nextCursor는 해석하지 않고 그대로 넘긴다(서버 소유)
export function useBookmarkPages(
  status: BookmarkStatus,
  filter: BookmarkFilter = {},
) {
  return useInfiniteQuery({
    queryKey: getBookmarksControllerListQueryKey({ status, ...filter }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await bookmarksControllerList(
        { status, ...filter, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      );
      if (res.status !== 200) throw new ServerMessageError(res.data.message);
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: (query) =>
      query.state.data?.pages.some((p) =>
        p.items.some((b) => b.thumbnail.status === "pending"),
      )
        ? THUMBNAIL_POLL_MS
        : false,
  });
}

// 저장·삭제·복구 뒤 링크 목록(활성·휴지통, 필터별)과 카테고리 목록만 다시 받는다.
// 카테고리 목록은 칩 줄의 링크 수(전체·미분류·카테고리별)가 바뀌어서 함께 받는다(CAT-01)
export function useInvalidateBookmarkLists() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getBookmarksControllerListQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getCategoriesControllerListQueryKey(),
      }),
    ]);
}
