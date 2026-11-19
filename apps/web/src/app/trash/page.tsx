import { AppShell } from "@/features/app-shell";
import { AccountMenu, RequireAuth } from "@/features/auth";
import { BookmarkList } from "@/features/bookmarks";

// 휴지통(FEAT-002, FEAT-009에서 사이드바 메뉴로 분리)
export default function TrashPage() {
  return (
    <RequireAuth>
      <AppShell account={<AccountMenu />}>
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-4 pb-16 md:px-10 md:pt-8">
          <h1 className="text-title font-semibold tracking-tight">휴지통</h1>
          <BookmarkList status="deleted" />
        </main>
      </AppShell>
    </RequireAuth>
  );
}
