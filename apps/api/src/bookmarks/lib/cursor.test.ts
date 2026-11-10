import { decodeCursor, encodeCursor, isUuid } from "./cursor.js";

const ID = "0b8f3c1e-2a4d-4e6f-8a1b-3c5d7e9f1a2b";

describe("목록 커서 (FEAT-002 AC-02)", () => {
  it("인코딩한 값을 그대로 되돌린다(밀리초 포함)", () => {
    const at = new Date("2026-11-10T01:02:03.456Z");

    expect(decodeCursor(encodeCursor({ at, id: ID }))).toEqual({ at, id: ID });
  });

  it.each([
    ["base64가 아니면", "!!!"],
    ["JSON이 아니면", Buffer.from("nope").toString("base64url")],
    [
      "시각이 아니면",
      Buffer.from(JSON.stringify({ at: "x", id: ID })).toString("base64url"),
    ],
    [
      "id가 UUID가 아니면",
      Buffer.from(
        JSON.stringify({ at: new Date().toISOString(), id: "1 OR 1=1" }),
      ).toString("base64url"),
    ],
    ["너무 길면", "a".repeat(201)],
  ])("%s 거부한다", (_, raw) => {
    expect(decodeCursor(raw)).toBeNull();
  });

  it("UUID 형식만 통과시킨다", () => {
    expect(isUuid(ID)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
