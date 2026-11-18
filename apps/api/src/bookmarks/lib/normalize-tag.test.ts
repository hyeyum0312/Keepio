import { describe, expect, it } from "vitest";
import { toTagName, uniqueTagNames } from "./normalize-tag.js";

describe("태그 이름 정규화 (FEAT-010 AC-02)", () => {
  it("AC-02: 앞뒤 공백을 지우고 연속 공백을 한 칸으로, 영문은 소문자로 비교한다", () => {
    expect(toTagName("  Motion   Design ")).toEqual({
      name: "Motion Design",
      normalizedName: "motion design",
    });
  });

  it("AC-02: 조합형 한글(NFD)도 완성형(NFC)과 같은 태그다", () => {
    const nfd = "사이드";
    expect(toTagName(nfd)?.normalizedName).toBe("사이드");
  });

  it("AC-01: 비었거나 30자를 넘으면 거부한다", () => {
    expect(toTagName("   ")).toBeNull();
    expect(toTagName("가".repeat(31))).toBeNull();
    expect(toTagName("가".repeat(30))?.name).toHaveLength(30);
  });

  it("AC-02: 같은 이름이 여러 번 오면 처음 것만 남긴다", () => {
    expect(uniqueTagNames(["Reel", "reel", " REEL ", "모션"])).toEqual([
      { name: "Reel", normalizedName: "reel" },
      { name: "모션", normalizedName: "모션" },
    ]);
  });

  it("AC-01: 하나라도 잘못된 이름이 있으면 전체를 거부한다", () => {
    expect(uniqueTagNames(["ok", ""])).toBeNull();
  });
});
