import { maskEmail } from "./mask-email.js";

describe("maskEmail", () => {
  it("첫 글자와 도메인만 남긴다", () => {
    expect(maskEmail("hyeyeon@example.com")).toBe("h***@example.com");
  });

  it("형식이 이상하면 전부 가린다", () => {
    expect(maskEmail("@example.com")).toBe("***");
  });
});
