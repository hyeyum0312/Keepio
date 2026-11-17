import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @keepio/api-client는 TS 소스를 그대로 내보낸다
  transpilePackages: ["@keepio/api-client"],
  // 개발 표시 배지가 사이드바 아래(테마·접기 버튼)를 가리지 않게 오른쪽 아래로
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
