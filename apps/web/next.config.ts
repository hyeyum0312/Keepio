import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @keepio/api-client는 TS 소스를 그대로 내보낸다
  transpilePackages: ["@keepio/api-client"],
};

export default nextConfig;
