import Image from "next/image";

// FEAT-010: 서버가 주는 표시 제목(넣은 제목 → 페이지 제목 → 도메인)이 있으면 그것을 쓴다
export type TriageLink = {
  id: string;
  url: string;
  title?: string | null;
  displayTitle?: string;
};
export type CategoryChip = {
  id: string;
  name: string;
  // 카테고리 썸네일 캐릭터 색(카테고리 ID로 정해지는 표시용 값, FEAT-008)
  face: "yellow" | "blue" | "red" | "purple" | "tangerine";
};

const FACE_BG = {
  yellow: "bg-face-yellow",
  blue: "bg-face-blue",
  red: "bg-face-red",
  purple: "bg-face-purple",
  tangerine: "bg-face-tangerine",
} as const;

function host(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// 정리할 링크 한 줄(홈의 유일한 그림자 카드, 07-BRAND 6장). 칩을 누르면 바로 분류, 건너뛰기는 다음 링크.
// 카테고리 칩은 카테고리 서버(FEAT-008)가 붙기 전에는 넘기지 않는다(빈 배열이면 그리지 않음)
export function TriageRow({
  link,
  chips = [],
  onPick,
  onSkip,
}: {
  link: TriageLink;
  chips?: CategoryChip[];
  onPick?: (categoryId: string) => void;
  onSkip: () => void;
}) {
  return (
    <article
      aria-label="정리할 링크"
      className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-[0_1px_2px_var(--shadow-soft),0_8px_24px_var(--shadow-soft)] md:flex-row md:items-center md:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          aria-hidden="true"
          className="h-12 w-16 shrink-0 rounded-xl bg-muted"
        />
        <div className="min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-semibold hover:underline focus-visible:focus-ring"
          >
            {link.displayTitle ?? link.title ?? host(link.url)}
          </a>
          <p className="truncate text-caption text-muted-foreground">
            {host(link.url)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {chips.length > 0 && (
          <div
            role="group"
            aria-label="카테고리 선택"
            className="flex flex-1 gap-1.5 overflow-x-auto md:flex-none"
          >
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onPick?.(chip.id)}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-surface pr-3.5 pl-1.5 text-sm font-medium transition-transform hover:-translate-y-0.5 hover:border-foreground focus-visible:focus-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex size-8 items-end justify-center overflow-hidden rounded-full ${FACE_BG[chip.face]}`}
                >
                  <Image
                    src={`/svg/keepio-${chip.face}-symbol-light.svg`}
                    alt=""
                    width={19}
                    height={26}
                    unoptimized
                    className="translate-y-2"
                  />
                </span>
                {chip.name}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 shrink-0 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground focus-visible:focus-ring"
        >
          건너뛰기
        </button>
      </div>
    </article>
  );
}
