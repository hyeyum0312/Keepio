// Orval 생성 함수가 쓰는 fetch. 응답은 상태 코드별 유니온({ data, status, headers })으로 돌려주고
// 오류 상태를 throw하지 않는다. 호출하는 쪽이 status로 분기한다(예: 409 복구 안내).
let baseUrl = "";

export function configureApiClient(options: { baseUrl: string }) {
  baseUrl = options.baseUrl.replace(/\/$/, "");
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${url}`, {
    credentials: "include",
    ...init,
  });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
}
