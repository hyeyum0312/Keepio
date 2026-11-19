import type { ReactNode } from "react";
import { SaveBookmarkForm } from "./SaveBookmarkForm";

// 링크 저장 카드(LINK-01 전체 링크 시안). 홈과 전체 링크가 같은 모양을 쓴다.
// note: 폼 위 안내 문구(예: 예시 홈), action: 오른쪽 위 보조 버튼(예: 닫기)
export function SaveLinkCard({
  note,
  action,
}: {
  note?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      aria-label="링크 저장"
      className="relative overflow-hidden rounded-3xl border border-border-subtle bg-muted/60"
    >
      <div
        aria-hidden="true"
        className="kp-save-art absolute inset-y-0 left-0 hidden w-56 md:block"
      />
      <div className="relative flex flex-col gap-3 p-4 md:p-7">
        {(note || action) && (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-[13px] text-muted-foreground">
              {note}
            </div>
            {action}
          </div>
        )}
        <SaveBookmarkForm />
      </div>
    </section>
  );
}
