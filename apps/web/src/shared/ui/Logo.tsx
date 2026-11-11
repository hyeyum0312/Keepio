import Image from "next/image";
import { Outfit } from "next/font/google";

// 워드마크 전용 폰트(디자인 시안: Outfit 700). next/font가 빌드 때 받아 자체 호스팅한다
const outfit = Outfit({ weight: "700", subsets: ["latin"], display: "swap" });

// 대표 컬러 레드. 다른 컬러: public/svg/keepio-{red|yellow|tangerine|blue|purple}-symbol-light.svg
const SYMBOL_SRC = "/svg/keepio-red-symbol-light.svg";

// 심볼 + 서비스명. 심볼은 장식이라 alt를 비우고, 이름은 텍스트로 읽힌다
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      {/* SVG는 최적화 대상이 아니므로 unoptimized(원본 그대로 제공) */}
      <Image
        src={SYMBOL_SRC}
        alt=""
        width={21}
        height={27}
        unoptimized
        priority
      />
      <span
        className={`${outfit.className} text-2xl leading-none tracking-tight`}
      >
        keepio
      </span>
    </span>
  );
}
