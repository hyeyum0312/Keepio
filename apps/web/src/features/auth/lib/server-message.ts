import type { ApiErrorResponse } from "@keepio/api-client";
import { NETWORK_ERROR_MESSAGE } from "@/shared/lib/network-error";

// ADR-009: 오류 문구는 서버 message 그대로. 프론트는 만들거나 바꾸지 않는다
export function serverMessage(res: { status: number; data: unknown }): string {
  const message = (res.data as Partial<ApiErrorResponse> | undefined)?.message;
  return typeof message === "string" ? message : NETWORK_ERROR_MESSAGE;
}

// 응답이 오면 성공 여부를, 요청 자체가 실패하면(fetch throw) 고정 문구를 돌려준다
export async function submit<R extends { status: number; data: unknown }>(
  request: () => Promise<R>,
  isSuccess: (res: R) => boolean,
): Promise<{ ok: true; res: R } | { ok: false; message: string }> {
  try {
    const res = await request();
    return isSuccess(res)
      ? { ok: true, res }
      : { ok: false, message: serverMessage(res) };
  } catch {
    return { ok: false, message: NETWORK_ERROR_MESSAGE };
  }
}
