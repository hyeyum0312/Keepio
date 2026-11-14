"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshSession } from "../model/refresh-session";
import { Notice } from "@/shared/ui/FormParts";
import { confirmPendingSocialLogin } from "../model/last-login-method";
import { AuthStage } from "./AuthStage";

// FEAT-004 AC-12. API가 Refresh 쿠키를 심고 보낸 화면. refresh 1번으로 Access Token을 받아 홈으로.
// 앱 시작 refresh(AuthBootstrap)와 동시에 불려도 refreshSession이 1번으로 묶는다
export function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    void refreshSession().then((ok) => {
      // FEAT-007 AC-03: 소셜 로그인 성공이 확인되면 "최근 사용"을 확정한다
      if (ok) confirmPendingSocialLogin();
      router.replace(ok ? "/" : "/login?oauth=failed");
    });
  }, [router]);

  return (
    <AuthStage title="로그인하는 중이에요" compact>
      <Notice>잠시만 기다려 주세요…</Notice>
    </AuthStage>
  );
}
