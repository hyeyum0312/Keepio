// Orval 생성 함수가 쓰는 fetch. 응답은 상태 코드별 유니온({ data, status, headers })으로 돌려주고
// 오류 상태를 throw하지 않는다. 호출하는 쪽이 status로 분기한다(예: 409 복구 안내).
let baseUrl = "";
let defaultHeaders: Record<string, string> = {};

// headers: 모든 요청에 붙일 헤더(예: 개발 모드의 x-dev-user-id). 요청별 헤더가 같은 이름이면 요청별 값이 이긴다
export function configureApiClient(options: {
  baseUrl: string;
  headers?: Record<string, string>;
}) {
  baseUrl = options.baseUrl.replace(/\/$/, "");
  defaultHeaders = options.headers ?? {};
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(defaultHeaders);
  new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
  const response = await fetch(`${baseUrl}${url}`, {
    credentials: "include",
    ...init,
    headers,
  });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
}
