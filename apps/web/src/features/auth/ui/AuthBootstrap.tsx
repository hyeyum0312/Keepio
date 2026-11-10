"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { refreshSession } from "../model/refresh-session";
import { getAuthStatus, subscribeAuthStatus } from "../model/session-store";

// FEAT-006 AC-05·AC-06. 앱 시작 시 refresh 1번으로 로그인 상태를 되살리고(새로고침 유지),
// 비로그인이 되면 사용자 데이터 캐시를 비운다(다른 사용자의 데이터가 남지 않게)
export function AuthBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (getAuthStatus() === "checking") void refreshSession();
  }, []);

  useEffect(
    () =>
      subscribeAuthStatus(() => {
        if (getAuthStatus() === "anonymous") queryClient.clear();
      }),
    [queryClient],
  );

  return null;
}
