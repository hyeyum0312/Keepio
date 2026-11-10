"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// FEAT-006 AC-08·AC-11: 메일 링크의 토큰을 한 번 읽고 즉시 주소에서 지운다(방문 기록·뒤로 가기·공유에 남지 않게).
// 지운 뒤에도 쓸 수 있도록 처음 값을 상태로 붙잡아 둔다. 사용하는 컴포넌트는 Suspense 안에 둔다(Next 16 useSearchParams)
export function useOneTimeUrlToken(): string {
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("token")) return;
    url.searchParams.delete("token");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  return token;
}
