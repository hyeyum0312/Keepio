"use client";

import {
  bookmarksControllerList,
  getBookmarksControllerListQueryKey,
} from "@keepio/api-client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

export type BookmarkStatus = "active" | "deleted";

// 서버가 준 오류 문구를 담는다(ADR-009). 요청 자체가 실패한 경우(fetch throw)와 구분하려고 따로 둔다
export class ServerMessageError extends Error {}

// FEAT-002 AC-10·12. 커서 페이지 목록. 키는 생성 키(status 포함), stale 기본값, 폴링 없음.
// nextCursor는 해석하지 않고 그대로 넘긴다(서버 소유)
export function useBookmarkPages(status: BookmarkStatus) {
  return useInfiniteQuery({
    queryKey: getBookmarksControllerListQueryKey({ status }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await bookmarksControllerList(
        { status, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      );
      if (res.status !== 200) throw new ServerMessageError(res.data.message);
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

// 저장·삭제·복구 뒤 두 목록(활성·휴지통)만 다시 받는다(다른 쿼리는 건드리지 않는다)
export function useInvalidateBookmarkLists() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: getBookmarksControllerListQueryKey(),
    });
}
