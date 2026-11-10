"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStatus } from "../model/useAuthStatus";
import { Notice } from "./FormParts";

// FEAT-006 AC-05·AC-06·AC-12. 확인 중에는 로딩만(로그인 화면으로 깜빡이지 않게), 비로그인이면 /login.
// 토큰이 메모리에만 있어 서버(Next)는 로그인 여부를 모른다. 실제 권한 검사는 API가 한다
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStatus();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <Notice>불러오는 중이에요…</Notice>
      </main>
    );
  }
  return children;
}
