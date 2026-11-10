// FEAT-002 AC-02. 목록 커서 = 마지막 항목의 (정렬 시각, id). 클라이언트는 해석하지 않고 그대로 돌려보낸다.
// 오프셋 대신 키셋이라 페이지 사이에 새로 저장돼도 이미 본 항목이 중복·누락되지 않는다
export type Cursor = { at: Date; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CURSOR_LENGTH = 200;

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(
    JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }),
  ).toString("base64url");
}

// 형식이 틀리면 null(호출한 쪽이 400으로 거부)
export function decodeCursor(raw: string): Cursor | null {
  if (raw.length > MAX_CURSOR_LENGTH) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString()) as {
      at?: unknown;
      id?: unknown;
    };
    if (typeof value.at !== "string" || typeof value.id !== "string") {
      return null;
    }
    const at = new Date(value.at);
    if (Number.isNaN(at.getTime()) || !UUID.test(value.id)) return null;
    return { at, id: value.id };
  } catch {
    return null;
  }
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
