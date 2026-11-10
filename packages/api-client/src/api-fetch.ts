// Orval 생성 함수가 쓰는 fetch. 응답은 상태 코드별 유니온({ data, status, headers })으로 돌려주고
// 오류 상태를 throw하지 않는다. 호출하는 쪽이 status로 분기한다(예: 409 복구 안내).
let baseUrl = "";
// 토큰 첨부·401 재시도 같은 인증 정책은 앱이 주입한다(FEAT-006). 이 패키지는 전송만 맡는다
let fetchImpl: typeof fetch = (input, init) => fetch(input, init);

export function configureApiClient(options: {
  baseUrl: string;
  fetch?: typeof fetch;
}) {
  baseUrl = options.baseUrl.replace(/\/$/, "");
  if (options.fetch) fetchImpl = options.fetch;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetchImpl(`${baseUrl}${url}`, {
    credentials: "include",
    ...init,
  });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
}
