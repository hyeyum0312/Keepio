"use client";

import { configureApiClient } from "@keepio/api-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "./query-client";

const DEV_API_BASE_URL = "http://localhost:7711";
// 인증(D-04) 전 개발용 사용자(D-11). prisma/seed-dev-user.sql과 같은 ID
const DEV_USER_ID = "00000000-0000-4000-8000-000000000001";

const isProduction = process.env.NODE_ENV === "production";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBaseUrl && isProduction) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production");
}
configureApiClient({
  baseUrl: apiBaseUrl ?? DEV_API_BASE_URL,
  // 운영 빌드는 보내지 않는다(api도 운영에서는 이 헤더를 무시하고 401)
  headers: isProduction ? undefined : { "x-dev-user-id": DEV_USER_ID },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // 요청·사용자 간 캐시가 섞이지 않도록 컴포넌트 수명마다 하나 만든다
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
