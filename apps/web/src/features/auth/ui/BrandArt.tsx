// 인증 화면의 캐릭터 그림(07-BRAND 7장). 장식이라 모두 aria-hidden.
// 라이트는 평면 심볼, 다크는 유리알 심볼(발광 여백이 있어 같은 크기로 보이려면 약 1.55배). 모드 전환은 시스템 설정(dark:)
import Image from "next/image";
import { useId } from "react";

type Color = "red" | "yellow" | "blue" | "tangerine" | "purple";

const BODY =
  "M10 0H54C59.5228 0 64 4.47715 64 10V88L32 72L0 88V10C0 4.47715 4.47715 0 10 0Z";
const GLASS = 136 / 88;

function src(color: Color, mode: "light" | "dark") {
  return `/svg/keepio-${color}-symbol-${mode}.svg`;
}

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
export function KeepioSymbol({
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
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 64 88"
        height={height}
        width={(height * 64) / 88}
        className={`overflow-visible dark:hidden ${className}`}
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
      <svg
        aria-hidden="true"
        viewBox="-24 -24 112 136"
        height={height * GLASS}
        width={height * GLASS * (112 / 136)}
        className={`hidden overflow-visible dark:block ${className}`}
        style={{ margin: -(height * GLASS - height) / 2, ...style }}
      >
        <defs>
          <radialGradient id={`${id}g`} cx="50%" cy="58%" r="62%">
            <stop offset="0" style={{ stopColor: "var(--glass-deep)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--glass-mid)" }} />
            <stop offset="1" style={{ stopColor: "var(--glass-light)" }} />
          </radialGradient>
          <radialGradient id={`${id}h`} cx="40%" cy="18%" r="45%">
            <stop
              offset="0"
              style={{ stopColor: "var(--symbol-eye)", stopOpacity: 0.75 }}
            />
            <stop
              offset="1"
              style={{ stopColor: "var(--symbol-eye)", stopOpacity: 0 }}
            />
          </radialGradient>
          <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d={BODY}
          opacity="0.6"
          filter={`url(#${id}b)`}
          style={{ fill: "var(--glass-mid)" }}
        />
        <path d={BODY} fill={`url(#${id}g)`} />
        <path
          d={BODY}
          fill="none"
          strokeWidth="1"
          strokeOpacity="0.7"
          style={{ stroke: "var(--glass-light)" }}
        />
        <path d={BODY} fill={`url(#${id}h)`} />
        <Eyes />
      </svg>
    </>
  );
}

// 작은 로고: 대표 캐릭터 + keepio
export function Lockup({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <KeepioSymbol height={size} />
      <span className="text-xl font-semibold tracking-tight">keepio</span>
    </span>
  );
}

// 패밀리 심볼: 노랑·파랑 사이로 대표 캐릭터. celebrate면 축하 모션(07-BRAND 8장)
export function FamilySymbol({
  scale = 1,
  celebrate = false,
}: {
  scale?: number;
  celebrate?: boolean;
}) {
  const k = (v: number) => Math.round(v * scale);
  const c = (n: 1 | 2 | 3) =>
    celebrate ? `kp-celebrate kp-celebrate-${n}` : "";
  const side = (color: Color, left: number, n: 1 | 3) => (
    <>
      <Image
        src={src(color, "light")}
        alt=""
        aria-hidden="true"
        unoptimized
        width={k(50)}
        height={k(69)}
        className={`absolute h-auto dark:hidden ${c(n)}`}
        style={{ left: k(left), top: k(27) }}
      />
      <Image
        src={src(color, "dark")}
        alt=""
        aria-hidden="true"
        unoptimized
        width={k(88)}
        height={k(107)}
        className={`absolute hidden h-auto dark:block ${c(n)}`}
        style={{ left: k(left === 0 ? -19 : 74), top: k(8) }}
      />
    </>
  );
  return (
    <div
      aria-hidden="true"
      className="relative shrink-0"
      style={{ width: k(143), height: k(104) }}
    >
      {side("yellow", 0, 1)}
      {side("blue", 93, 3)}
      <KeepioSymbol
        height={k(104)}
        className={`absolute ${c(2)}`}
        style={{ left: k(37), top: 0 }}
      />
    </div>
  );
}

// PC 무대 가장자리 캐릭터(07-BRAND 7.1). 모바일에서는 숨긴다
const STAGE: {
  color: Color;
  size: number;
  pos: React.CSSProperties;
  rotate: number;
}[] = [
  { color: "yellow", size: 96, pos: { left: "6%", top: "18%" }, rotate: -12 },
  { color: "blue", size: 72, pos: { left: "14%", top: "64%" }, rotate: 8 },
  { color: "purple", size: 56, pos: { left: "26%", top: "8%" }, rotate: 6 },
  {
    color: "tangerine",
    size: 88,
    pos: { right: "8%", top: "14%" },
    rotate: 10,
  },
  { color: "red", size: 120, pos: { right: "12%", top: "58%" }, rotate: -6 },
  { color: "yellow", size: 48, pos: { right: "26%", top: "84%" }, rotate: -14 },
  { color: "blue", size: 44, pos: { left: "34%", top: "88%" }, rotate: 12 },
];

export function StageCharacters() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden md:block"
    >
      {STAGE.map(({ color, size, pos, rotate }, i) => (
        <div
          key={i}
          className="absolute"
          style={{ ...pos, transform: `rotate(${rotate}deg)` }}
        >
          <Image
            src={src(color, "light")}
            alt=""
            unoptimized
            width={Math.round((size * 64) / 88)}
            height={size}
            className="h-auto dark:hidden"
          />
          <Image
            src={src(color, "dark")}
            alt=""
            unoptimized
            width={Math.round(size * GLASS * (112 / 136))}
            height={Math.round(size * GLASS)}
            className="hidden h-auto dark:block"
            style={{ margin: -Math.round((size * GLASS - size) / 2) }}
          />
        </div>
      ))}
    </div>
  );
}
