import type { ReactNode } from "react";
import { SaveBookmarkForm } from "./SaveBookmarkForm";

// 링크 저장 카드(LINK-01 전체 링크 시안). 홈과 전체 링크가 같은 모양을 쓴다.
// note: 폼 위 안내 문구(예: 예시 홈), action: 오른쪽 아래 보조 버튼(예: 닫기)
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
        {note && (
          <div className="text-[13px] text-muted-foreground">{note}</div>
        )}
        <SaveBookmarkForm />
      </div>
      {/* 닫기 같은 보조 버튼은 "추가 정보" 줄 오른쪽 끝에 띄운다. 줄을 따로 만들지 않아 홈과 전체 링크의 카드 모양이 같다 */}
      {action && (
        <div className="absolute right-4 bottom-2 md:right-7 md:bottom-5">
          {action}
        </div>
      )}
    </section>
  );
}
