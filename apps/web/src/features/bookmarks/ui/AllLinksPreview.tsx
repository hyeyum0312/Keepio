"use client";

import {
  type BookmarkListResponse,
  getBookmarksControllerListQueryKey,
} from "@keepio/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AllLinks } from "./AllLinks";

function sample(
  n: number,
  title: string,
  url: string,
  tags: string[],
  art: string,
) {
  return {
    id: `preview-${n}`,
    url,
    normalizedUrl: url,
    createdAt: new Date(Date.UTC(2026, 10, 19 - n)).toISOString(),
    deletedAt: null,
    title,
    displayTitle: title,
    titleSource: "user" as const,
    categoryId: null,
    tags: tags.map((name) => ({ id: `${n}-${name}`, name })),
    thumbnail: {
      status: "ready" as const,
      url: `/bucket-art/${art}.webp`,
      sourceUrl: null,
    },
    faviconUrl: null,
  };
}

const PREVIEW_LIST: BookmarkListResponse = {
  items: [
    sample(
      1,
      "200만 조회수가 증명한 그리운 목소리… 꿈꾸던 어른이 되었나요",
      "https://www.youtube.com/watch?v=preview",
      [],
      "coral",
    ),
    sample(
      2,
      "모바일 청첩장",
      "https://www.pagesisters.cc/",
      ["결혼준비", "모바일청첩장"],
      "green",
    ),
    sample(
      3,
      "클로드코드 팁",
      "https://www.instagram.com/p/preview/",
      ["클로드", "ai"],
      "blue",
    ),
    sample(
      4,
      "hyeyum0312.github.io",
      "https://hyeyum0312.github.io/",
      [],
      "orange",
    ),
  ],
  nextCursor: null,
};

// 디자인 미리보기 전용 내 링크(샘플 데이터, 로그인 없이). 목록은 미리 채운 캐시만 쓰고 서버에 다시 묻지 않는다.
// 저장·삭제는 서버로 가므로 로그인하지 않았으면 오류 문구가 보인다(문구 모양 확인용)
export function AllLinksPreview() {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(getBookmarksControllerListQueryKey({ status: "active" }), {
      pages: [PREVIEW_LIST],
      pageParams: [null],
    });
    return c;
  });
  return (
    <QueryClientProvider client={client}>
      <AllLinks />
    </QueryClientProvider>
  );
}
