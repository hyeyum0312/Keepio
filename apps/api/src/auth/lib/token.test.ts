import { generateToken, hashToken, isWellFormedToken } from "./token.js";

describe("token", () => {
  it("256비트 base64url 토큰을 만들고 매번 다르다", () => {
    const a = generateToken();
    const b = generateToken();
    expect(isWellFormedToken(a)).toBe(true);
    expect(Buffer.from(a, "base64url")).toHaveLength(32);
    expect(a).not.toBe(b);
  });

  it("해시는 32바이트이고 같은 입력이면 같다(DB CHECK와 일치)", () => {
    const token = generateToken();
    expect(hashToken(token)).toHaveLength(32);
    expect(hashToken(token)).toEqual(hashToken(token));
  });

  it.each([
    ["빈 값", ""],
    ["짧음", "abc"],
    ["허용 외 문자", `${"a".repeat(42)}=`],
    ["김", "a".repeat(44)],
  ])("%s이면 형식 오류", (_, input) => {
    expect(isWellFormedToken(input)).toBe(false);
  });
});
