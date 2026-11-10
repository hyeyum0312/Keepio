import { refreshSession } from "./refresh-session";
import { getAccessToken } from "./session-store";

// 인증 API 자체의 401(로그인 실패·refresh 실패)에는 refresh를 시도하지 않는다(AC-03, 무한 반복 방지)
const AUTH_PATH = "/api/auth/";

// api-client에 주입하는 fetch(FEAT-006 AC-02·AC-03).
// 토큰을 붙이고, Access Token 만료(401 UNAUTHENTICATED)면 refresh 1번 후 원래 요청을 1번만 다시 보낸다
export const authFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, withToken(init));
  if (response.status !== 401 || isAuthPath(input)) return response;
  if (!(await isUnauthenticated(response))) return response;
  if (!(await refreshSession())) return response;
  return fetch(input, withToken(init));
};

function withToken(init: RequestInit | undefined): RequestInit {
  const token = getAccessToken();
  if (!token) return { ...init };
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

function isAuthPath(input: RequestInfo | URL) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return new URL(url, "http://local").pathname.startsWith(AUTH_PATH);
}

// 본문은 호출한 쪽이 읽어야 하므로 복제본으로 확인한다
async function isUnauthenticated(response: Response) {
  try {
    const body: unknown = await response.clone().json();
    return (body as { code?: unknown })?.code === "UNAUTHENTICATED";
  } catch {
    return false;
  }
}
