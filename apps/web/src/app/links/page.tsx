import { AppShell } from "@/features/app-shell";
import { AccountMenu, RequireAuth } from "@/features/auth";
import { BookmarkList, SaveBookmarkForm } from "@/features/bookmarks";

// 전체 링크(FEAT-009): 저장 + 활성 목록. 디자인 정리는 링크 목록 화면 작업에서
export default function LinksPage() {
  return (
    <RequireAuth>
      <AppShell
        account={{
          up: <AccountMenu open="up" />,
          down: <AccountMenu open="down" />,
        }}
      >
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-4 pb-16 md:px-10 md:pt-8">
          <h1 className="text-title font-semibold tracking-tight">전체 링크</h1>
          <SaveBookmarkForm />
          <BookmarkList status="active" />
        </main>
      </AppShell>
    </RequireAuth>
  );
}
