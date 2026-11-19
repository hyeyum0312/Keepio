import Link from "next/link";
import { BucketTiles, type BucketTile } from "./BucketTiles";
import { HomeIcon } from "./HomeIcons";
import { SharedPages, type SharedPage } from "./SharedPages";

function Section({
  id,
  title,
  count,
  action,
  children,
}: {
  id: string;
  title: string;
  // 서버가 준 정확한 개수만 넘긴다(일부 페이지로 세지 않는다)
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-6 md:px-0">
        <h2
          id={id}
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight md:text-[22px]"
        >
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold text-muted-foreground">
              {count}개
            </span>
          )}
        </h2>
        {action}
      </div>
      <div className="px-6 md:px-0">{children}</div>
    </section>
  );
}

// "전체 보기 →": 목록 화면이 생기기 전에는 누를 수 없고 "준비 중"으로 읽힌다
function SeeAll({ href }: { href?: string }) {
  const body = (
    <>
      전체 보기 <HomeIcon name="arrow" size={16} />
    </>
  );
  const cls =
    "inline-flex min-h-11 items-center gap-1 rounded-lg text-sm text-foreground/80";
  return href ? (
    <Link
      href={href}
      className={`${cls} hover:text-foreground focus-visible:focus-ring`}
    >
      {body}
    </Link>
  ) : (
    <span role="link" aria-disabled="true" title="준비 중" className={cls}>
      {body}
      <span className="sr-only">(준비 중)</span>
    </span>
  );
}

// 홈(FEAT-009, 2026-11-19 시안): 정리할 링크 → 버킷 → 공유한 페이지. 비어 있는 섹션은 그리지 않는다.
// 검색·알림·계정은 앱 틀 위쪽 막대에 있다. 링크 저장 칸은 사이드바 "링크 추가"(/?save=1)로 연다
export function HomeView({
  triage,
  triageCount,
  buckets,
  pages,
  savePanel,
}: {
  triage: React.ReactNode;
  triageCount?: number;
  buckets: BucketTile[];
  pages: SharedPage[];
  savePanel?: React.ReactNode;
}) {
  return (
    // 위쪽 검색 막대와 왼쪽 끝을 맞춘다(시안). 아주 넓은 화면에서는 오른쪽에 여백이 남는다
    <main className="flex w-full max-w-5xl flex-col gap-10 pt-6 pb-16 md:gap-12 md:px-10 md:pt-8">
      {savePanel && <div className="px-6 md:px-0">{savePanel}</div>}
      {triage && (
        <Section
          id="home-triage"
          title="정리할 링크"
          count={triageCount}
          action={
            <span
              role="button"
              aria-disabled="true"
              aria-label="정리할 링크 더보기 (준비 중)"
              title="준비 중"
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground"
            >
              <HomeIcon name="more" size={20} />
            </span>
          }
        >
          {triage}
        </Section>
      )}
      {buckets.length > 0 && (
        <Section
          id="home-buckets"
          title="버킷"
          count={buckets.length}
          action={<SeeAll />}
        >
          <BucketTiles buckets={buckets} />
        </Section>
      )}
      {pages.length > 0 && (
        <Section
          id="home-pages"
          title="공유한 페이지"
          count={pages.length}
          action={<SeeAll />}
        >
          <SharedPages pages={pages} />
        </Section>
      )}
    </main>
  );
}
