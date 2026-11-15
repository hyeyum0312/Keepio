"use client";

import { useSearchParams } from "next/navigation";
import { Home } from "./Home";

// 사이드바 "링크 추가"(/?save=1)로 들어오면 저장 칸을 연 채로 시작한다
export function HomeRoute() {
  const params = useSearchParams();
  return (
    <Home
      key={params.get("save") ?? ""}
      openSave={params.get("save") === "1"}
    />
  );
}
