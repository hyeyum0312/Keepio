import Image from "next/image";
import { notFound } from "next/navigation";
import { AppShell } from "@/features/app-shell";
import { HomePreview } from "@/features/home";
import { isPreviewEnabled } from "@/shared/lib/preview";

// 디자인 확인용 홈(샘플 데이터, 로그인 없이). 개발 환경에서만 열리고 배포에서는 404
export default function HomePreviewPage() {
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
      <HomePreview />
    </AppShell>
  );
}
