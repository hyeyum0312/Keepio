"use client";

import { configureApiClient } from "@keepio/api-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "./query-client";

const DEV_API_BASE_URL = "http://localhost:7711";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production");
}
configureApiClient({ baseUrl: apiBaseUrl ?? DEV_API_BASE_URL });

export function Providers({ children }: { children: React.ReactNode }) {
  // 요청·사용자 간 캐시가 섞이지 않도록 컴포넌트 수명마다 하나 만든다
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
