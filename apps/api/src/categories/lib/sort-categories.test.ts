import { describe, expect, it } from "vitest";
import { compareCategories, nameGroup } from "./sort-categories.js";

function cat(name: string, pinnedAt: Date | null = null) {
  return { name, pinnedAt };
}

describe("카테고리 정렬 (FEAT-008 AC-14·15)", () => {
  it("첫 글자 종류: 한글 → 영문 → 숫자 → 그 밖", () => {
    expect(
      [cat("#임시"), cat("2026"), cat("Design"), cat("여행")]
        .sort(compareCategories)
        .map((c) => c.name),
    ).toEqual(["여행", "Design", "2026", "#임시"]);
  });

  it("같은 종류 안에서는 이름순(한글은 가나다, 영문은 abc)", () => {
    expect(
      [cat("하늘"), cat("가방"), cat("나무")]
        .sort(compareCategories)
        .map((c) => c.name),
    ).toEqual(["가방", "나무", "하늘"]);
    expect(
      [cat("Zebra"), cat("apple"), cat("Banana")]
        .sort(compareCategories)
        .map((c) => c.name),
    ).toEqual(["apple", "Banana", "Zebra"]);
  });

  it("고정한 카테고리가 먼저 오고, 고정한 순서를 지킨다", () => {
    const sorted = [
      cat("가방"),
      cat("읽을거리", new Date("2026-11-22T01:00:00Z")),
      cat("Design", new Date("2026-11-22T00:00:00Z")),
    ]
      .sort(compareCategories)
      .map((c) => c.name);
    expect(sorted).toEqual(["Design", "읽을거리", "가방"]);
  });

  it("한자·일본어처럼 분류에 없는 문자는 그 밖으로 본다", () => {
    expect(nameGroup("漢字")).toBe(3);
    expect(nameGroup("ひらがな")).toBe(3);
    expect(nameGroup("ㄱ")).toBe(0);
  });
});
