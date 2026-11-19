import { AppShell } from "@/features/app-shell";
import { AccountMenu, RequireAuth } from "@/features/auth";
import { AllLinks } from "@/features/bookmarks";

// 전체 링크(FEAT-009 후속, LINK-01 2026-11-19 시안): 저장 카드 + 정리한 링크(목록형/카드형).
// 검색·알림·계정은 앱 틀 위쪽 막대에 있다
export default function LinksPage() {
  return (
    <RequireAuth>
      <AppShell account={<AccountMenu />}>
        <main className="flex w-full max-w-5xl flex-col gap-6 px-6 pt-6 pb-16 md:gap-8 md:px-10 md:pt-8">
          {/* 사이드바에서 이미 "전체 링크"가 선택돼 있어 화면 제목은 보조기기용으로만 둔다 */}
          <h1 className="sr-only">전체 링크</h1>
          <AllLinks />
        </main>
      </AppShell>
    </RequireAuth>
  );
}
