import { HomeIcon } from "./HomeIcons";

export type SharedPage = {
  id: string;
  title: string;
  url: string;
  isPublic: boolean;
};

// 공유용 링크 목록(2026-11-21 시안: 테두리 상자 안의 행, 회색 아이콘). 공유 페이지 기능 전에는 미리보기·예시에서만 그린다.
// 모바일은 공개 상태·링크 복사를 숨기고 더보기만 둔다. 예시(sample)는 누를 것이 없어 버튼을 그리지 않는다.
// 기능이 붙으면 제목은 편집 화면 링크, 링크 복사·더보기는 실제 동작으로 바꾼다
export function SharedPages({
  pages,
  sample = false,
}: {
  pages: SharedPage[];
  sample?: boolean;
}) {
  return (
    <ul className="flex flex-col rounded-2xl border border-border-subtle bg-surface px-4 md:px-5">
      {pages.map((page) => (
        <li
          key={page.id}
          className="flex items-center gap-4 border-b border-border-subtle py-4 last:border-b-0"
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80">
            <HomeIcon name="link" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{page.title}</p>
            <p className="truncate text-caption text-muted-foreground">
              {page.url}
            </p>
          </div>
          <span
            className={`hidden shrink-0 rounded-full px-2.5 py-1 text-caption font-semibold sm:inline ${
              page.isPublic
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {page.isPublic ? "공개 중" : "비공개"}
          </span>
          {!sample && (
            <>
              <button
                type="button"
                className="hidden min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border-subtle px-3.5 text-sm focus-visible:focus-ring sm:inline-flex"
              >
                <HomeIcon name="copy" size={16} />
                링크 복사
              </button>
              <button
                type="button"
                aria-label={`${page.title} 더보기: 편집·공개 상태 변경·삭제`}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:focus-ring"
              >
                <HomeIcon name="more" />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
