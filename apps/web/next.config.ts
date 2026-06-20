import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @keepio/core 는 TS 소스를 그대로 노출하므로 Next 가 직접 트랜스파일하게 한다.
  transpilePackages: ["@keepio/core"],
};

export default nextConfig;
