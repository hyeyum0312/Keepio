import { describe, expect, it } from "vitest";
import {
  MAX_CATEGORY_LENGTH,
  cleanCategoryName,
  toCategoryName,
} from "./normalize-category-name.js";

describe("카테고리 이름 정규화 (FEAT-008 AC-02)", () => {
  it("앞뒤 공백을 지우고 연속 공백을 한 칸으로 줄인다", () => {
    expect(cleanCategoryName("  여행   메모 ")).toBe("여행 메모");
  });

  it("중복 판정 값은 영문 소문자로 맞춘다. 표시 이름은 그대로 둔다", () => {
    expect(toCategoryName(" TRAVEL ")).toEqual({
      name: "TRAVEL",
      normalizedName: "travel",
    });
    expect(toCategoryName("travel")?.normalizedName).toBe("travel");
  });

  it("자모가 분리된 한글(NFD)도 같은 값으로 본다", () => {
    const nfd = "여행".normalize("NFD");
    expect(toCategoryName(nfd)?.normalizedName).toBe("여행");
  });

  it("빈 이름과 20자를 넘는 이름은 null", () => {
    expect(toCategoryName("   ")).toBeNull();
    expect(toCategoryName("가".repeat(MAX_CATEGORY_LENGTH))).not.toBeNull();
    expect(toCategoryName("가".repeat(MAX_CATEGORY_LENGTH + 1))).toBeNull();
  });
});
