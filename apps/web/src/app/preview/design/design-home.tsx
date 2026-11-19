import Link from "next/link";
import { Suspense } from "react";
import { DesignNav, DesignViewer } from "@/features/design-preview";
import { KeepioWordmark } from "@/shared/ui/KeepioWordmark";

// 개발용 기획·디자인 화면. 앱 틀과 별개의 단독 페이지라 로그인 여부와 관계없이 열린다(dev 배포 전까지 임시)
export function DesignHome() {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border-subtle px-3 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-2 focus-visible:focus-ring"
        >
          <KeepioWordmark size={24} />
        </Link>
        <Suspense>
          <DesignNav />
        </Suspense>
      </aside>
      <div className="min-w-0 flex-1">
        <Suspense>
          <DesignViewer />
        </Suspense>
      </div>
    </div>
  );
}
