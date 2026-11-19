import Image from "next/image";
import { notFound } from "next/navigation";
import { AppShell } from "@/features/app-shell";
import { AllLinksPreview } from "@/features/bookmarks";
import { isPreviewEnabled } from "@/shared/lib/preview";

// 디자인 확인용 전체 링크(샘플 데이터, 로그인 없이). 개발 환경에서만 열리고 배포에서는 404
export default function LinksPreviewPage() {
  if (!isPreviewEnabled()) notFound();
  return (
    <AppShell
      account={
        // 미리보기는 로그인 없이 열리므로 계정 메뉴 대신 같은 모양의 원만 둔다
        <span className="relative inline-flex size-11 overflow-hidden rounded-full">
          <Image
            src="/bucket-art/coral.webp"
            alt=""
            fill
            sizes="44px"
            className="object-cover"
          />
        </span>
      }
    >
      <main className="flex w-full max-w-5xl flex-col gap-6 px-6 pt-6 pb-16 md:gap-8 md:px-10 md:pt-8">
        <h1 className="text-title font-bold tracking-tight">전체 링크</h1>
        <AllLinksPreview />
      </main>
    </AppShell>
  );
}
