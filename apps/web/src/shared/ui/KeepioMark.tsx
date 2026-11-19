// 대표(레드) 캐릭터 심볼. 눈동자가 움직이고 깜빡인다(globals.css kp-pupils·kp-eyes, 감소 모션이면 멈춤).
// 회사 마스코트 캐릭터라 로고로 쓰지 않는다(ADR-016). 인증·랜딩 무대와 빈 상태에서만 쓴다(07-BRAND 7장)
import { useId } from "react";

const BODY =
  "M10 0H54C59.5228 0 64 4.47715 64 10V88L32 72L0 88V10C0 4.47715 4.47715 0 10 0Z";

// 대표 캐릭터 눈. 눈동자가 움직이고 깜빡인다(globals.css kp-pupils·kp-eyes, 감소 모션이면 멈춤)
function Eyes() {
  return (
    <g className="kp-eyes">
      <circle cx="23" cy="38" r="6" style={{ fill: "var(--symbol-eye)" }} />
      <circle cx="41" cy="38" r="6" style={{ fill: "var(--symbol-eye)" }} />
      <g className="kp-pupils">
        <circle
          cx="23"
          cy="38"
          r="2.5"
          style={{ fill: "var(--symbol-pupil)" }}
        />
        <circle
          cx="41"
          cy="38"
          r="2.5"
          style={{ fill: "var(--symbol-pupil)" }}
        />
      </g>
    </g>
  );
}

// 대표(레드) 캐릭터. 눈을 움직이려고 인라인 SVG로 그린다
export function KeepioMark({
  height,
  className = "",
  style,
}: {
  height: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 88"
      height={height}
      width={(height * 64) / 88}
      className={`overflow-visible ${className}`}
      style={style}
    >
      <defs>
        <linearGradient
          id={`${id}l`}
          x1="32"
          y1="0"
          x2="32"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: "var(--symbol-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--symbol-bottom)" }} />
        </linearGradient>
      </defs>
      <path
        d={BODY}
        fill={`url(#${id}l)`}
        style={{ stroke: "var(--symbol-line)" }}
        strokeWidth="1"
      />
      <Eyes />
    </svg>
  );
}
