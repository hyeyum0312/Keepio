import Image from "next/image";

// 사용자 제작 로고(심볼 + 워드마크가 패스로 들어 있어 폰트 불필요). 원본 105×30
const LOGO_SRC = "/svg/keepio-logo.svg";

// 이미지 안에 서비스명이 있으므로 alt로 읽힌다
export function Logo() {
  return (
    // SVG는 최적화 대상이 아니므로 unoptimized(원본 그대로 제공)
    <Image
      src={LOGO_SRC}
      alt="keepio"
      width={105}
      height={30}
      unoptimized
      priority
    />
  );
}
