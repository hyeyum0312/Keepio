// FEAT-007 AC-03 "최근 사용" 배지. 방법 이름만 저장한다(토큰·이메일은 저장하지 않는다, FEAT-006 AC-01).
// 저장소를 쓸 수 없는 환경(사파리 비공개 모드 등)에서는 조용히 생략한다
import { useSyncExternalStore } from "react";

export type LoginMethod = "kakao" | "google" | "email";

const LAST_KEY = "keepio.lastLoginMethod";
// 소셜은 페이지를 떠났다가 콜백으로 돌아오므로, 누를 때 후보로 두고 콜백 성공 시 확정한다
const PENDING_KEY = "keepio.pendingLoginMethod";
const METHODS: readonly string[] = ["kakao", "google", "email"];

function isMethod(value: string | null): value is LoginMethod {
  return value !== null && METHODS.includes(value);
}

export function readLastLoginMethod(): LoginMethod | null {
  try {
    const value = window.localStorage.getItem(LAST_KEY);
    return isMethod(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveLastLoginMethod(method: LoginMethod) {
  try {
    window.localStorage.setItem(LAST_KEY, method);
  } catch {
    // 저장소를 못 쓰면 배지만 생략
  }
}

export function rememberPendingSocialLogin(method: "kakao" | "google") {
  try {
    window.sessionStorage.setItem(PENDING_KEY, method);
  } catch {
    // 저장소를 못 쓰면 배지만 생략
  }
}

export function confirmPendingSocialLogin() {
  try {
    const value = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (isMethod(value)) saveLastLoginMethod(value);
  } catch {
    // 저장소를 못 쓰면 배지만 생략
  }
}

// 화면이 열릴 때 한 번 읽는다. 서버 렌더에서는 배지 없음(저장소가 없다)
const noop = () => () => {};
export function useLastLoginMethod(): LoginMethod | null {
  return useSyncExternalStore(noop, readLastLoginMethod, () => null);
}
