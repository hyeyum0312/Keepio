import type { NextConfig } from "next";

// 배포에서 web과 api를 같은 주소로 묶는다: 브라우저는 web 주소의 /api/* 를 부르고, Vercel이 api 서버로 넘긴다.
// refresh 쿠키(SameSite=Lax)와 소셜 로그인 콜백이 web 주소에서 그대로 동작한다. 값이 없으면(로컬) 프록시를 쓰지 않는다
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // @keepio/api-client는 TS 소스를 그대로 내보낸다
  transpilePackages: ["@keepio/api-client"],
  // 개발 표시 배지가 사이드바 아래(테마·접기 버튼)를 가리지 않게 오른쪽 아래로
  devIndicators: { position: "bottom-right" },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      { source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` },
    ];
  },
};

export default nextConfig;
