export type SharedPage = {
  id: string;
  title: string;
  url: string;
  isPublic: boolean;
};

// 공유한 페이지 목록(행 + 구분선). 공유 페이지 기능 전에는 미리보기에서만 그린다.
// 기능이 붙으면 제목은 편집 화면 링크, 링크 복사·더보기는 실제 동작으로 바꾼다
export function SharedPages({ pages }: { pages: SharedPage[] }) {
  return (
    <ul className="flex flex-col">
      {pages.map((page) => (
        <li
          key={page.id}
          className="flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{page.title}</p>
            <p className="truncate text-caption text-muted-foreground">
              {page.url}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${page.isPublic ? "bg-success" : "bg-border"}`}
            />
            {page.isPublic ? "공개" : "비공개"}
          </span>
          <button
            type="button"
            className="hidden min-h-9 rounded-full border border-border px-3.5 text-sm focus-visible:focus-ring sm:inline-flex sm:items-center"
          >
            링크 복사
          </button>
          <button
            type="button"
            aria-label={`${page.title} 더보기: 편집·공개 상태 변경·삭제`}
            className="size-9 rounded-full text-muted-foreground hover:bg-muted focus-visible:focus-ring"
          >
            ···
          </button>
        </li>
      ))}
    </ul>
  );
}
