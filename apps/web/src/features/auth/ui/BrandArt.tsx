// 인증 화면의 캐릭터 그림(07-BRAND 7장). 장식이라 모두 aria-hidden.
// 라이트·다크 모두 같은 평면 심볼을 쓴다(07-BRAND 7장 v4: 다크의 유리알·발광 표현은 쓰지 않는다)
import Image from "next/image";
import { useId } from "react";

type Color = "red" | "yellow" | "blue" | "tangerine" | "purple";

const BODY =
  "M10 0H54C59.5228 0 64 4.47715 64 10V88L32 72L0 88V10C0 4.47715 4.47715 0 10 0Z";

function src(color: Color) {
  return `/svg/keepio-${color}-symbol-light.svg`;
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
    <Image
      src={src(color)}
      alt=""
      aria-hidden="true"
      unoptimized
      width={k(50)}
      height={k(69)}
      className={`absolute h-auto ${c(n)}`}
      style={{ left: k(left), top: k(27) }}
    />
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

type Placement = {
  color: Color;
  size: number;
  pos: React.CSSProperties;
  rotate: number;
}[];

// PC 무대(07-BRAND 7.1 v3): 크기 대비를 크게, 큰 포인트 2개(왼쪽 위 노랑·오른쪽 빨강).
// 강하게 잘리는 캐릭터는 오른쪽 빨강 하나뿐이고 나머지는 V자 하단까지 전체가 보인다. 간격·각도는 일부러 불균등
const STAGE: Placement = [
  { color: "yellow", size: 164, pos: { left: "3%", top: "9%" }, rotate: -12 },
  { color: "red", size: 216, pos: { right: -44, top: "49%" }, rotate: -8 },
  {
    color: "tangerine",
    size: 92,
    pos: { right: "14%", top: "7%" },
    rotate: 12,
  },
  { color: "blue", size: 64, pos: { left: "15%", top: "67%" }, rotate: 9 },
  { color: "purple", size: 40, pos: { left: "27%", top: "10%" }, rotate: 5 },
  { color: "yellow", size: 34, pos: { right: "31%", top: "89%" }, rotate: -17 },
  { color: "blue", size: 52, pos: { left: "6%", bottom: 22 }, rotate: 15 },
];

// 모바일: 위쪽에만, 잘리는 캐릭터는 빨강 하나. 폼 화면(compact)은 더 작게 2개
const MOBILE: Placement = [
  { color: "red", size: 128, pos: { right: -28, top: 30 }, rotate: -8 },
  { color: "yellow", size: 44, pos: { left: 24, top: 104 }, rotate: -12 },
  { color: "blue", size: 30, pos: { left: 92, top: 46 }, rotate: 10 },
];
const MOBILE_COMPACT: Placement = [
  { color: "red", size: 84, pos: { right: -20, top: 16 }, rotate: -8 },
  { color: "yellow", size: 30, pos: { right: 74, top: 70 }, rotate: -12 },
];

function Placed({ list, className }: { list: Placement; className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {list.map(({ color, size, pos, rotate }, i) => (
        <div
          key={i}
          className="absolute"
          style={{ ...pos, transform: `rotate(${rotate}deg)` }}
        >
          <Image
            src={src(color)}
            alt=""
            unoptimized
            width={Math.round((size * 64) / 88)}
            height={size}
            className="h-auto"
          />
        </div>
      ))}
    </div>
  );
}

export function StageCharacters({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <Placed list={STAGE} className="hidden md:block" />
      <Placed list={compact ? MOBILE_COMPACT : MOBILE} className="md:hidden" />
    </>
  );
}

// 첫 화면 색 번짐(라이트 전용). 모양·색은 globals.css kp-wash-*
export function StageWash() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="kp-wash kp-wash-coral" />
      <div className="kp-wash kp-wash-pink" />
      <div className="kp-wash kp-wash-peach" />
      <div className="kp-wash kp-wash-blue" />
      <div className="kp-wash kp-wash-butter" />
      <div className="kp-wash-clear" />
    </div>
  );
}
