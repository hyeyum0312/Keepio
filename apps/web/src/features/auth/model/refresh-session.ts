import { authControllerRefresh } from "@keepio/api-client";
import { clearSession, setSession } from "./session-store";

let inFlight: Promise<boolean> | null = null;

// FEAT-006 AC-04: 동시에 여러 곳에서 불러도 refresh 요청은 1번. 모두 같은 결과를 기다린다.
// 서버는 같은 쿠키의 동시 회전을 1번만 허용하므로(FEAT-003 AC-12) 여기서 묶지 않으면 진 요청이 401이 된다
export function refreshSession(): Promise<boolean> {
  inFlight ??= runRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runRefresh(): Promise<boolean> {
  try {
    const res = await authControllerRefresh();
    if (res.status === 200) {
      setSession(res.data.accessToken);
      return true;
    }
  } catch {
    // 네트워크 오류도 로그인 상태를 확인할 수 없으므로 비로그인으로 본다(AC-05)
  }
  clearSession();
  return false;
}
