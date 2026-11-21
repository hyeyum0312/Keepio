import { AppShell } from "@/features/app-shell";
import { AccountMenu, RequireAuth } from "@/features/auth";
import { AllLinks } from "@/features/bookmarks";

// 내 링크(FEAT-009 후속, LINK-01 2026-11-19 시안): 저장 카드 + 정리한 링크(목록형/카드형).
// 검색·알림·계정은 앱 틀 위쪽 막대에 있다
export default function LinksPage() {
  return (
    <RequireAuth>
      <AppShell account={<AccountMenu />}>
        <main className="flex w-full max-w-5xl flex-col gap-6 px-6 pt-6 pb-16 md:gap-8 md:px-10 md:pt-8">
          {/* 2026-11-21 시안: 화면 제목 "내 링크"를 PC·모바일 모두 보이게 둔다(미리보기와 같은 모양) */}
          <h1 className="text-lg font-bold tracking-tight">내 링크</h1>
          <AllLinks />
        </main>
      </AppShell>
    </RequireAuth>
  );
}
