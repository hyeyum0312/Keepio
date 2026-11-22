import { describe, expect, it } from "vitest";
import { matches, sameName } from "./match";

describe("카테고리 찾기 (FEAT-008 AC-13)", () => {
  it("공백과 대소문자를 무시하고 찾는다", () => {
    expect(matches("모션 그래픽", "모션")).toBe(true);
    expect(matches("모션그래픽", "모션 ")).toBe(true);
    expect(matches("Design", "des")).toBe(true);
    expect(matches("여행", "모션")).toBe(false);
  });

  it("똑같은 이름 판정은 서버와 같은 기준(연속 공백 1칸·대소문자 무시)", () => {
    expect(sameName("여행", "  여행 ")).toBe(true);
    expect(sameName("TRAVEL", "travel")).toBe(true);
    // 공백이 들어간 이름은 다른 카테고리다(서버 중복 판정과 같다)
    expect(sameName("여 행", "여행")).toBe(false);
  });
});
