// FEAT-006 AC-01: Access Token은 이 모듈의 메모리에만 있다(저장소·쿠키에 쓰지 않는다).
// 상태는 refresh·로그인 결과에서만 바뀐다. checking = 앱 시작 후 첫 refresh 결과 대기
export type AuthStatus = "checking" | "authenticated" | "anonymous";

let accessToken: string | null = null;
let status: AuthStatus = "checking";
const listeners = new Set<() => void>();

export function getAccessToken() {
  return accessToken;
}

export function getAuthStatus() {
  return status;
}

export function setSession(token: string) {
  accessToken = token;
  setStatus("authenticated");
}

export function clearSession() {
  accessToken = null;
  setStatus("anonymous");
}

export function subscribeAuthStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setStatus(next: AuthStatus) {
  if (status === next) return;
  status = next;
  for (const listener of listeners) listener();
}

// 테스트 전용: 모듈 상태 초기화
export function resetSessionForTest() {
  accessToken = null;
  status = "checking";
  listeners.clear();
}
