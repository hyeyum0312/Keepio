import { describe, expect, it } from "vitest";
import { parseOpenGraph } from "./open-graph.js";

const PAGE = "https://www.instagram.com/p/Df4Gbo2kYej/";

describe("parseOpenGraph (FEAT-010 AC-04·07)", () => {
  it("AC-04: og:image와 og:title을 읽는다(속성 순서·따옴표 무관)", () => {
    const html = `<head>
      <meta content='Studio on Instagram: &quot;new reel&quot;' property='og:title'>
      <meta property="og:image" content="https://scontent.cdninstagram.com/v/a.jpg?stp=1&amp;oh=2" />
    </head>`;
    expect(parseOpenGraph(html, PAGE)).toEqual({
      image: "https://scontent.cdninstagram.com/v/a.jpg?stp=1&oh=2",
      title: 'Studio on Instagram: "new reel"',
    });
  });

  it("AC-04: 상대 주소는 페이지 기준 절대 주소로 바꾸고, http(s)가 아니면 버린다", () => {
    expect(
      parseOpenGraph(`<meta property="og:image" content="/img/a.png">`, PAGE)
        .image,
    ).toBe("https://www.instagram.com/img/a.png");
    expect(
      parseOpenGraph(
        `<meta property="og:image" content="javascript:alert(1)">`,
        PAGE,
      ).image,
    ).toBeNull();
  });

  it("AC-07: 제목은 공백을 정리하고 300자로 자른다", () => {
    const html = `<meta property="og:title" content="  a\n\n b ${"x".repeat(400)}">`;
    const { title } = parseOpenGraph(html, PAGE);
    expect(title?.startsWith("a b ")).toBe(true);
    expect(title).toHaveLength(300);
  });

  it("AC-05: og 태그가 없으면 둘 다 null", () => {
    expect(parseOpenGraph("<html><title>x</title></html>", PAGE)).toEqual({
      image: null,
      title: null,
    });
  });
});
