import { BucketTiles, type BucketTile } from "./BucketTiles";
import { SharedPages, type SharedPage } from "./SharedPages";

function Section({
  id,
  title,
  count,
  more,
  children,
}: {
  id: string;
  title: string;
  // 서버가 준 정확한 개수만 넘긴다(일부 페이지로 세지 않는다)
  count?: number;
  more?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 px-6 md:px-0">
        <h2
          id={id}
          className="flex items-center gap-2 text-xl font-bold md:text-[22px]"
        >
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold text-muted-foreground">
              {count}개
            </span>
          )}
        </h2>
        {more && <span className="text-sm text-muted-foreground">{more}</span>}
      </div>
      <div className="px-6 md:px-0">{children}</div>
    </section>
  );
}

// 홈(FEAT-009, 와이어 E1·E3): 검색 → 정리할 링크 → 버킷 → 공유한 페이지. 비어 있는 섹션은 그리지 않는다.
// 정리할 링크는 홈의 유일한 그림자 카드, 나머지는 상자 없이 여백·제목으로 구분(07-BRAND 6장)
export function HomeView({
  triage,
  triageCount,
  buckets,
  pages,
  saveButton,
  savePanel,
}: {
  triage: React.ReactNode;
  triageCount?: number;
  buckets: BucketTile[];
  pages: SharedPage[];
  saveButton: React.ReactNode;
  savePanel?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-11 pt-4 pb-16 md:gap-14 md:px-10 md:pt-6">
      <div className="flex flex-col gap-3 px-6 md:px-0">
        <div className="flex items-center gap-2">
          <label htmlFor="home-search" className="sr-only">
            검색
          </label>
          <input
            id="home-search"
            type="search"
            disabled
            placeholder="링크·버킷·태그 검색 (준비 중)"
            className="h-12 min-w-0 flex-1 rounded-full border border-border bg-muted px-5 text-base placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          {saveButton}
        </div>
        {savePanel}
      </div>
      {triage && (
        <Section id="home-triage" title="정리할 링크" count={triageCount}>
          {triage}
        </Section>
      )}
      {buckets.length > 0 && (
        <Section
          id="home-buckets"
          title="버킷"
          count={buckets.length}
          more="모두 보기 →"
        >
          <BucketTiles buckets={buckets} />
        </Section>
      )}
      {pages.length > 0 && (
        <Section
          id="home-pages"
          title="공유한 페이지"
          count={pages.length}
          more="모두 보기 →"
        >
          <SharedPages pages={pages} />
        </Section>
      )}
    </main>
  );
}
