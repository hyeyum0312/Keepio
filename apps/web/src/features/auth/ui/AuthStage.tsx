// 인증 화면 공통 레이아웃(FEAT-007, 07-BRAND 7.1 무대형 v3).
// PC: 가장자리 캐릭터 + 색 번짐 + 작은 로고 + 큰 제목 + 가운데 카드.
// 모바일: 위쪽에 캐릭터(하나만 잘림) + 왼쪽 정렬 로고·제목, 카드 테두리 없이 전체 폭(여백 24px)
import { FamilySymbol, Lockup, StageCharacters, StageWash } from "./BrandArt";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

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
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <StageWash />
      {!celebrate && <StageCharacters compact={compact} />}
      <ThemeToggle className="absolute right-4 bottom-4 z-10 md:top-6 md:right-6 md:bottom-auto" />
      <div
        className={`relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 md:justify-center ${
          celebrate
            ? "gap-8 pt-12 md:gap-8 md:py-16"
            : compact
              ? "gap-6 pt-10 md:gap-5 md:py-5"
              : "gap-7 pt-48 md:gap-9 md:py-16"
        }`}
      >
        <div
          className={`flex flex-col md:items-center md:text-center ${
            celebrate
              ? "flex-1 items-center justify-center gap-6 text-center md:flex-none md:gap-3"
              : "items-start gap-3 text-left md:gap-4"
          }`}
        >
          {celebrate ? (
            <FamilySymbol scale={1.2} celebrate />
          ) : (
            <Lockup size={compact ? 20 : 24} />
          )}
          <div
            className={`flex flex-col gap-3 md:items-center ${celebrate ? "kp-rise items-center" : ""}`}
          >
            <h1
              className={`leading-tight font-semibold tracking-tight ${
                compact
                  ? "text-title md:text-headline"
                  : "text-title md:text-display"
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
        <div
          className={`flex w-full flex-col md:rounded-3xl md:border md:border-border-subtle md:bg-surface md:px-6 ${
            compact ? "gap-6 md:gap-4 md:py-5" : "gap-6 md:pt-8 md:pb-6"
          }`}
        >
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
