import { MAX_EMAIL_LENGTH, normalizeEmail } from "./email.js";

describe("normalizeEmail", () => {
  it("AC-02: 앞뒤 공백을 지우고 소문자로 바꾼다", () => {
    expect(normalizeEmail("  Hye.Yeon@Example.COM ")).toEqual({
      ok: true,
      email: "hye.yeon@example.com",
    });
  });

  it.each([
    ["빈 값", ""],
    ["@ 없음", "user.example.com"],
    ["도메인 점 없음", "user@localhost"],
    ["로컬 파트 없음", "@example.com"],
    ["공백 포함", "us er@example.com"],
    ["@ 두 개", "a@b@example.com"],
    ["빈 도메인 라벨", "user@example..com"],
  ])("AC-02: %s이면 거부한다", (_, input) => {
    expect(normalizeEmail(input)).toEqual({ ok: false });
  });

  it("AC-02: 254자를 넘거나 로컬 파트가 64자를 넘으면 거부한다", () => {
    const domain = "@example.com";
    const tooLong = "a".repeat(MAX_EMAIL_LENGTH - domain.length + 1) + domain;
    expect(normalizeEmail(tooLong)).toEqual({ ok: false });
    expect(normalizeEmail("a".repeat(65) + domain)).toEqual({ ok: false });
    expect(normalizeEmail("a".repeat(64) + domain).ok).toBe(true);
  });
});
