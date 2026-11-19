import { Young_Serif } from "next/font/google";

// 로고 워드마크(ADR-016): Young Serif "keepio", i 점 자리에 레드 북마크. 마침표 없음.
// 글자는 currentColor(라이트 잉크·다크 밝은 글자), 북마크는 --logo-mark(라이트 #EE5041·다크 #FB8070)
const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export function KeepioWordmark({
  size = 24,
  className = "",
}: {
  // 글자 크기(px)
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="keepio"
      className={`${youngSerif.className} inline-flex items-baseline leading-none ${className}`}
      style={{ fontSize: size, letterSpacing: "-0.02em" }}
    >
      <span aria-hidden="true">keep</span>
      <span aria-hidden="true" className="relative inline-block">
        ı
        <svg
          viewBox="0 0 12 16"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: "0.04em", width: "0.15em", height: "0.2em" }}
        >
          <path
            d="M1 1h10v14l-5-3.4-5 3.4z"
            style={{ fill: "var(--logo-mark)", stroke: "var(--logo-mark)" }}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span aria-hidden="true">o</span>
    </span>
  );
}

// 작은 마크(사이드바 접힘·파비콘과 같은 모양): 잉크 바탕 + 레드 북마크
export function KeepioIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="keepio"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
    >
      <rect
        width="32"
        height="32"
        rx="7"
        style={{ fill: "var(--logo-tile)" }}
      />
      <path
        d="M10.5 7.5h11v17l-5.5-3.8-5.5 3.8z"
        style={{ fill: "var(--logo-mark-on-tile)" }}
      />
    </svg>
  );
}
