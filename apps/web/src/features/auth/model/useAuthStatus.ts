"use client";

import { useSyncExternalStore } from "react";
import {
  type AuthStatus,
  getAuthStatus,
  subscribeAuthStatus,
} from "./session-store";

// 서버 렌더에서는 토큰을 알 수 없으므로 항상 checking
export function useAuthStatus(): AuthStatus {
  return useSyncExternalStore(
    subscribeAuthStatus,
    getAuthStatus,
    () => "checking",
  );
}
