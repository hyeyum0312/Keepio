import { Suspense } from "react";
import { AppShell } from "@/features/app-shell";
import { AccountMenu, RequireAuth } from "@/features/auth";
import { HomeRoute } from "@/features/home";
import { isPreviewEnabled } from "@/shared/lib/preview";

// 로그인 상태면 앱 홈(FEAT-009). 비로그인은 당분간 랜딩 대신 /login으로 보낸다(2026-11-19 사용자 결정, 랜딩 시안 전까지).
// 개발 서버에서는 사이드바에 /preview/design 링크
export default function Page() {
  return (
    <RequireAuth>
      <AppShell
        account={<AccountMenu />}
        devLinks={
          isPreviewEnabled()
            ? [{ label: "기획·디자인", href: "/preview/design" }]
            : []
        }
      >
        <Suspense>
          <HomeRoute />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
