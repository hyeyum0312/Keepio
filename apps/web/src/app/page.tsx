import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/features/app-shell";
import { AccountMenu, AuthSwitch } from "@/features/auth";
import { HomeRoute } from "@/features/home";
import { Landing } from "@/features/landing";
import { isPreviewEnabled } from "@/shared/lib/preview";

// 로그인 상태면 앱 홈(FEAT-009), 아니면 랜딩(FEAT-006 AC-12). 개발 서버에서는 사이드바에 /preview/design 링크
export default function Page() {
  return (
    <AuthSwitch
      authenticated={
        <AppShell
          account={{
            up: <AccountMenu open="up" />,
            down: <AccountMenu open="down" />,
          }}
          sidebarExtra={
            isPreviewEnabled() && (
              <Link
                href="/preview/design"
                className="flex min-h-9 items-center rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted focus-visible:focus-ring"
              >
                기획·디자인 (개발용)
              </Link>
            )
          }
        >
          <Suspense>
            <HomeRoute />
          </Suspense>
        </AppShell>
      }
      anonymous={<Landing />}
    />
  );
}
