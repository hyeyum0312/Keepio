import type { ReactNode } from "react";
import { SaveBookmarkForm } from "./SaveBookmarkForm";

// 링크 저장 카드(공통 컴포넌트, 2026-11-21 시안). 홈 PC와 전체 링크가 같은 모양을 쓴다.
// UI는 무채색이라 색 번짐을 넣지 않는다(07-BRAND). note: 폼 위 안내 문구, action: 오른쪽 아래 보조 버튼(예: 닫기)
export function SaveLinkCard({
  note = "링크를 붙여넣으면 제목·썸네일을 자동으로 가져와요.",
  action,
}: {
  note?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      aria-label="링크 저장"
      className="relative rounded-3xl border border-border-subtle bg-muted/60"
    >
      <div className="flex flex-col gap-3 p-4 md:px-7 md:py-6">
        {note && (
          <div className="text-[13px] text-muted-foreground">{note}</div>
        )}
        <SaveBookmarkForm />
      </div>
      {/* 닫기 같은 보조 버튼은 "추가 정보" 줄 오른쪽 끝에 띄운다. 줄을 따로 만들지 않아 홈과 전체 링크의 카드 모양이 같다 */}
      {action && (
        <div className="absolute right-4 bottom-2 md:right-7 md:bottom-4">
          {action}
        </div>
      )}
    </section>
  );
}
