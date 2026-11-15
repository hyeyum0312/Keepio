import { notFound } from "next/navigation";
import { AppShell } from "@/features/app-shell";
import { HomePreview, PREVIEW_CATEGORIES } from "@/features/home";
import { isPreviewEnabled } from "@/shared/lib/preview";

// 디자인 확인용 홈(샘플 데이터, 로그인 없이). 개발 환경에서만 열리고 배포에서는 404
export default function HomePreviewPage() {
  if (!isPreviewEnabled()) notFound();
  return (
    <AppShell categories={PREVIEW_CATEGORIES}>
      <HomePreview />
    </AppShell>
  );
}
