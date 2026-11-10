import { AccountHeader, AuthSwitch } from "@/features/auth";
import { BookmarkPanel } from "@/features/bookmarks";
import { Landing } from "@/features/landing";

// 로그인 상태면 my-아이디·로그아웃 + 북마크, 아니면 랜딩(FEAT-006 AC-12, FEAT-002)
export default function Home() {
  return (
    <AuthSwitch
      authenticated={
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 p-6">
          <AccountHeader />
          <BookmarkPanel />
        </main>
      }
      anonymous={<Landing />}
    />
  );
}
