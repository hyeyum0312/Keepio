import Link from "next/link";
import { BucketTiles, type BucketTile } from "./BucketTiles";
import { HomeIcon } from "./HomeIcons";
import { SharedPages, type SharedPage } from "./SharedPages";

function Section({
  id,
  title,
  count,
  sample = false,
  intro,
  seeAllHref,
  children,
}: {
  id: string;
  title: string;
  // 서버가 준 정확한 개수만 넘긴다(일부 페이지로 세지 않는다)
  count?: number;
  // 예시 화면: 개수 대신 회색 "예시" 표시
  sample?: boolean;
  // 제목 아래 한 줄 안내(예시 화면의 버킷 등)
  intro?: string;
  // "전체 보기"가 갈 곳. 없으면 준비 중
  seeAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-6 md:px-0">
        {/* 제목 줄 끝에 "전체 보기"(세 섹션 공통) */}
        <div className="flex items-center justify-between gap-3">
          <h2
            id={id}
            className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-[22px]"
          >
            {title}
            {sample ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                예시
              </span>
            ) : (
              count !== undefined && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold text-muted-foreground">
                  {count}개
                </span>
              )
            )}
          </h2>
          <SeeAll section={title} href={seeAllHref} />
        </div>
        {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
      </div>
      <div className="px-6 md:px-0">{children}</div>
    </section>
  );
}

// "전체 보기 →": 목록 화면이 생기기 전에는 누를 수 없고 "준비 중"으로 읽힌다
function SeeAll({ href, section }: { href?: string; section: string }) {
  const body = (
    <>
      전체 보기 <HomeIcon name="arrow" size={16} />
    </>
  );
  const cls =
    "inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg text-sm text-muted-foreground";
  return href ? (
    <Link
      href={href}
      aria-label={`${section} 전체 보기`}
      className={`${cls} hover:text-foreground focus-visible:focus-ring`}
    >
      {body}
    </Link>
  ) : (
    <span
      role="link"
      aria-disabled="true"
      aria-label={`${section} 전체 보기 (준비 중)`}
      title="준비 중"
      className={cls}
    >
      {body}
    </span>
  );
}

// 홈(FEAT-009, 2026-11-21 시안): 최근 추가한 링크 → 버킷 → 공유용 링크. 비어 있는 섹션은 그리지 않는다.
// 검색·알림·계정은 앱 틀 위쪽 막대에 있다. PC는 맨 위에 링크 저장 카드(savePanel),
// 모바일은 본문 저장 칸 없이 오른쪽 아래 + 버튼(mobileAdd)으로 연다
export function HomeView({
  triage,
  triageCount,
  buckets,
  pages,
  savePanel,
  mobileAdd,
  sample = false,
}: {
  triage: React.ReactNode;
  triageCount?: number;
  buckets: BucketTile[];
  pages: SharedPage[];
  savePanel?: React.ReactNode;
  mobileAdd?: React.ReactNode;
  // 링크가 하나도 없는 첫 화면(예시로 채움)
  sample?: boolean;
}) {
  return (
    // 위쪽 검색 막대와 왼쪽 끝을 맞춘다(시안). 아주 넓은 화면에서는 오른쪽에 여백이 남는다
    <main className="flex w-full max-w-5xl flex-col gap-10 pt-6 pb-16 md:gap-12 md:px-10 md:pt-8">
      {savePanel && <div className="hidden md:block">{savePanel}</div>}
      {triage && (
        <Section
          id="home-triage"
          title="최근 추가한 링크"
          // 2026-11-21: 전체 보기는 내 링크로
          seeAllHref="/links"
          count={triageCount}
          sample={sample}
        >
          {triage}
        </Section>
      )}
      {buckets.length > 0 && (
        <Section
          id="home-buckets"
          title="버킷"
          count={sample ? undefined : buckets.length}
          sample={sample}
          intro={
            sample
              ? "주제별로 모아 두고, 링크 하나로 한 번에 공유해요."
              : undefined
          }
        >
          <BucketTiles buckets={buckets} />
        </Section>
      )}
      {pages.length > 0 && (
        <Section
          id="home-pages"
          title="공유용 링크"
          count={sample ? undefined : pages.length}
          sample={sample}
        >
          <SharedPages pages={pages} sample={sample} />
        </Section>
      )}
      {mobileAdd}
    </main>
  );
}
