import { describe, expect, it } from "vitest";
import { siteName } from "./site-name.js";

describe("siteName (FEAT-010 AC-17·18)", () => {
  it("AC-18: 스마트스토어·브랜드스토어는 주소의 가게 이름을 보여 준다(모바일 주소도)", () => {
    expect(
      siteName(
        "https://smartstore.naver.com/diaday/products/13854531009?NaPm=x",
      ),
    ).toBe("diaday · 스마트스토어");
    expect(
      siteName("https://m.smartstore.naver.com/nvnutra/products/13646818252"),
    ).toBe("nvnutra · 스마트스토어");
    expect(siteName("https://brand.naver.com/samsung/products/1")).toBe(
      "samsung · 브랜드스토어",
    );
  });

  it("AC-18: 가게 이름이 아닌 경로나 이상한 이름이면 사이트 이름만", () => {
    expect(siteName("https://smartstore.naver.com/main")).toBe(
      "smartstore.naver.com",
    );
    expect(siteName("https://smartstore.naver.com/")).toBe(
      "smartstore.naver.com",
    );
    expect(
      siteName("https://m.smartstore.naver.com/%EA%B0%80%EA%B2%8C/x"),
    ).toBe("smartstore.naver.com");
  });

  it("AC-17: 그 밖의 사이트는 앞의 www.·m.을 뺀 도메인, 주소가 아니면 null", () => {
    expect(siteName("https://www.youtube.com/watch?v=1")).toBe("youtube.com");
    expect(siteName("https://m.blog.naver.com/a/1")).toBe("blog.naver.com");
    expect(siteName("https://naver.me/5CCVAoip")).toBe("naver.me");
    expect(siteName("not a url")).toBeNull();
  });
});
