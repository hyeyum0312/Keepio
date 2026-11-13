// 인증 화면 공통 레이아웃(FEAT-007, 07-BRAND 7.1 무대형).
// PC: 가장자리 캐릭터 + 작은 로고 + 큰 제목 + 가운데 카드. 모바일: 패밀리 심볼 + 제목, 카드 테두리 없이 전체 폭(여백 24px)
import { FamilySymbol, Lockup, StageCharacters } from "./BrandArt";

export function AuthStage({
  title,
  subtitle,
  compact = false,
  celebrate = false,
  children,
}: {
  title: React.ReactNode;
  // 모바일 첫 화면에서만 보이는 부제
  subtitle?: React.ReactNode;
  // 폼 화면: 모바일에서 위 영역을 줄여 키보드가 올라와도 입력이 보이게
  compact?: boolean;
  celebrate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-stage">
      <StageCharacters />
      <div
        className={`relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 md:justify-center ${
          compact
            ? "gap-7 pt-10 md:gap-6 md:py-8"
            : "gap-8 pt-12 md:gap-8 md:py-16"
        }`}
      >
        <div
          className={`flex flex-col items-center text-center md:flex-none md:gap-3 ${
            compact ? "gap-2.5" : "flex-1 justify-center gap-6"
          }`}
        >
          <div className={celebrate ? "" : "md:hidden"}>
            <FamilySymbol
              scale={compact ? 0.62 : celebrate ? 1.2 : 1.35}
              celebrate={celebrate}
            />
          </div>
          {!compact && !celebrate && (
            <span className="-mt-3 text-2xl font-semibold tracking-tight md:hidden">
              keepio
            </span>
          )}
          <div className={celebrate ? "hidden" : "hidden md:block"}>
            <Lockup />
          </div>
          <div
            className={`flex flex-col items-center gap-3 ${celebrate ? "kp-rise" : ""}`}
          >
            <h1
              className={`leading-tight font-semibold tracking-tight ${
                compact ? "text-xl md:text-title" : "text-title md:text-display"
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`text-base leading-normal text-muted-foreground ${compact ? "" : "md:hidden"}`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-6 md:rounded-3xl md:border md:border-border md:bg-surface md:px-6 md:py-8">
          {children}
        </div>
      </div>
    </main>
  );
}

// 카드 안 구분선
export function Divider() {
  return <div className="h-px bg-border" />;
}
