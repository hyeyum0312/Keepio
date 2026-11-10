"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshSession } from "../model/refresh-session";
import { AuthLayout, Notice } from "./FormParts";

// FEAT-004 AC-12. API가 Refresh 쿠키를 심고 보낸 화면. refresh 1번으로 Access Token을 받아 홈으로.
// 앱 시작 refresh(AuthBootstrap)와 동시에 불려도 refreshSession이 1번으로 묶는다
export function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    void refreshSession().then((ok) =>
      router.replace(ok ? "/" : "/login?oauth=failed"),
    );
  }, [router]);

  return (
    <AuthLayout title="로그인">
      <Notice>로그인하는 중이에요…</Notice>
    </AuthLayout>
  );
}
