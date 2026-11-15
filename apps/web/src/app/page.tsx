import { Suspense } from "react";
import { AppShell } from "@/features/app-shell";
import { AccountMenu, AuthSwitch } from "@/features/auth";
import { HomeRoute } from "@/features/home";
import { Landing } from "@/features/landing";

// 로그인 상태면 앱 홈(FEAT-009), 아니면 랜딩(FEAT-006 AC-12)
export default function Page() {
  return (
    <AuthSwitch
      authenticated={
        <AppShell
          account={{
            up: <AccountMenu open="up" />,
            down: <AccountMenu open="down" />,
          }}
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
