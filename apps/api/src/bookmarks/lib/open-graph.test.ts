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

  it("AC-05: 대표 이미지·제목 태그가 하나도 없으면 둘 다 null", () => {
    expect(parseOpenGraph("<html><body><p>x</p></body></html>", PAGE)).toEqual({
      image: null,
      title: null,
    });
  });

  it("AC-12: og 태그가 없으면 twitter 태그, 그것도 없으면 <title>·image_src를 쓴다", () => {
    const twitter = `<meta name="twitter:title" content="T 제목">
      <meta name="twitter:image" content="https://cdn.example.com/t.jpg">
      <title>문서 제목</title>`;
    expect(parseOpenGraph(twitter, PAGE)).toEqual({
      image: "https://cdn.example.com/t.jpg",
      title: "T 제목",
    });

    const plain = `<head><title>
      뉴스 &amp; 이야기 | 사이트</title>
      <link href="/thumb.png" rel="image_src"></head>`;
    expect(parseOpenGraph(plain, PAGE)).toEqual({
      image: "https://www.instagram.com/thumb.png",
      title: "뉴스 & 이야기 | 사이트",
    });
  });

  it("AC-12: 태그가 HTML 어디에 있든 og가 twitter·<title>보다 우선한다", () => {
    const html = `<title>문서 제목</title>
      <meta name="twitter:title" content="T 제목">
      <meta name="twitter:image" content="https://cdn.example.com/t.jpg">
      <meta property="og:image" content="https://cdn.example.com/og.jpg">
      <meta property="og:title" content="OG 제목">`;
    expect(parseOpenGraph(html, PAGE)).toEqual({
      image: "https://cdn.example.com/og.jpg",
      title: "OG 제목",
    });
  });

  it("AC-12: 앞 순위 값이 비었거나 http(s)가 아니면 다음 순위로 넘어간다", () => {
    const html = `<meta property="og:title" content="  ">
      <meta property="og:image" content="data:image/png;base64,AAAA">
      <meta name="twitter:image:src" content="https://cdn.example.com/t.jpg">
      <title>문서 제목</title>`;
    expect(parseOpenGraph(html, PAGE)).toEqual({
      image: "https://cdn.example.com/t.jpg",
      title: "문서 제목",
    });
  });
});
