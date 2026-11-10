"use client";

import { useAuthStatus } from "../model/useAuthStatus";
import { Notice } from "@/shared/ui/FormParts";

// FEAT-006 AC-06·AC-12. 같은 주소에서 로그인 여부로 화면을 고른다(예: 홈 = 계정 화면 / 랜딩).
// 확인 중에는 로딩만(어느 쪽도 잠깐 보였다 바뀌지 않게). 토큰이 메모리에만 있어 브라우저에서만 판단한다
export function AuthSwitch({
  authenticated,
  anonymous,
}: {
  authenticated: React.ReactNode;
  anonymous: React.ReactNode;
}) {
  const status = useAuthStatus();
  if (status === "authenticated") return authenticated;
  if (status === "anonymous") return anonymous;
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Notice>불러오는 중이에요…</Notice>
    </main>
  );
}
