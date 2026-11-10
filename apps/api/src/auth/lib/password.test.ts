import {
  hashPassword,
  isValidPassword,
  verifyDummyPassword,
  verifyPassword,
} from "./password.js";

describe("isValidPassword", () => {
  it.each([
    ["7자", "a".repeat(7), false],
    ["8자", "a".repeat(8), true],
    ["128자", "a".repeat(128), true],
    ["129자", "a".repeat(129), false],
    ["이모지 8개(서로게이트 쌍)", "🔑".repeat(8), true],
    ["이모지 7개", "🔑".repeat(7), false],
  ])("AC-02: %s → %s", (_, password, expected) => {
    expect(isValidPassword(password)).toBe(expected);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("AC-01: argon2id(OWASP 권장 m=19MiB·t=2·p=1) 해시를 만들고 원문을 담지 않는다", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(hash).not.toContain("correct horse battery");
    await expect(verifyPassword(hash, "correct horse battery")).resolves.toBe(
      true,
    );
    await expect(verifyPassword(hash, "wrong password")).resolves.toBe(false);
  });

  it("같은 비밀번호도 매번 다른 해시가 된다(솔트)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(a).not.toBe(b);
  });

  it("손상된 해시는 예외 대신 false", async () => {
    await expect(verifyPassword("not-a-hash", "x")).resolves.toBe(false);
  });

  it("AC-08: 더미 검증은 항상 false", async () => {
    await expect(verifyDummyPassword("anything")).resolves.toBe(false);
  });
});
