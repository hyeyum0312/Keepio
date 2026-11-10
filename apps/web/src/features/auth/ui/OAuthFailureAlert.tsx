"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SOCIAL_LOGIN_FAILED_MESSAGE } from "@/shared/lib/network-error";

// FEAT-004 AC-13. /login?oauth=failed면 고정 문구(ADR-012)를 보여 주고 주소에서 값을 지운다.
// 문구는 주소에서 받지 않는다(임의 문구를 띄우는 링크 방지). 주소를 읽는 부분만 Suspense로 감싸 폼은 서버에서 그려진다
export function OAuthFailureAlert() {
  return (
    <Suspense>
      <Alert />
    </Suspense>
  );
}

function Alert() {
  const searchParams = useSearchParams();
  // 주소에서 지운 뒤에도 보이도록 처음 값을 붙잡아 둔다
  const [failed] = useState(() => searchParams.get("oauth") === "failed");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("oauth")) return;
    url.searchParams.delete("oauth");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  if (!failed) return null;
  return (
    <p role="alert" className="text-sm">
      {SOCIAL_LOGIN_FAILED_MESSAGE}
    </p>
  );
}
