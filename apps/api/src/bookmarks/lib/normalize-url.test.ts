import { MAX_URL_LENGTH, normalizeUrl } from "./normalize-url.js";

describe("normalizeUrl", () => {
  it.each([
    [
      "스킴·호스트를 소문자로",
      "HTTPS://Example.COM/Path",
      "https://example.com/Path",
    ],
    ["https 기본 포트를 제거", "https://a.com:443/x", "https://a.com/x"],
    ["http 기본 포트를 제거", "http://a.com:80/x", "http://a.com/x"],
    ["기본이 아닌 포트는 유지", "https://a.com:8443/x", "https://a.com:8443/x"],
    [
      "경로 대소문자와 끝 슬래시는 유지",
      "https://a.com/A/b/",
      "https://a.com/A/b/",
    ],
    ["경로가 없으면 표준대로 /를 붙임", "https://a.com", "https://a.com/"],
    [
      "추적 파라미터만 제거하고 나머지 순서는 유지",
      "https://a.com/x?b=2&utm_source=n&a=1&fbclid=z",
      "https://a.com/x?b=2&a=1",
    ],
    [
      "추적 파라미터 8개를 모두 제거하고 빈 ?도 없앰",
      "https://a.com/x?utm_source=1&utm_medium=2&utm_campaign=3&utm_term=4&utm_content=5&fbclid=6&gclid=7&igshid=8",
      "https://a.com/x",
    ],
    [
      "남은 파라미터의 인코딩은 원문 그대로",
      "https://a.com/?q=a%20b&r=1+2&utm_source=x",
      "https://a.com/?q=a%20b&r=1+2",
    ],
    [
      "이름이 정확히 같을 때만 제거",
      "https://a.com/?utm_source_x=1&UTM_SOURCE=2&ref=3",
      "https://a.com/?utm_source_x=1&UTM_SOURCE=2&ref=3",
    ],
    [
      "fragment는 유지",
      "https://a.com/x?utm_source=1#sec",
      "https://a.com/x#sec",
    ],
    [
      "한글 경로는 표준대로 인코딩",
      "https://a.com/카페",
      "https://a.com/%EC%B9%B4%ED%8E%98",
    ],
    ["앞뒤 공백은 표준대로 무시", "  https://a.com/x  ", "https://a.com/x"],
  ])("AC-05: %s", (_, input, expected) => {
    expect(normalizeUrl(input)).toEqual({ ok: true, normalizedUrl: expected });
  });

  it("AC-05: 정규화 결과가 같은 URL은 같은 값이 된다", () => {
    const a = normalizeUrl("HTTPS://A.com:443/x?id=1&utm_source=kakao");
    const b = normalizeUrl("https://a.com/x?id=1");

    expect(a).toEqual(b);
  });

  it.each([
    ["빈 문자열", "", "INVALID_URL"],
    ["스킴이 없는 주소", "example.com/x", "INVALID_URL"],
    ["파싱할 수 없는 주소", "https://", "INVALID_URL"],
    ["javascript 스킴", "javascript:alert(1)", "UNSUPPORTED_SCHEME"],
    ["ftp 스킴", "ftp://a.com/file", "UNSUPPORTED_SCHEME"],
    [
      "상한 초과 입력",
      `https://a.com/${"x".repeat(MAX_URL_LENGTH)}`,
      "URL_TOO_LONG",
    ],
    // 입력은 상한 이내지만 한글이 인코딩되며(1자 → 9자) 상한을 넘는다
    [
      "정규화 후 상한 초과",
      `https://a.com/${"가".repeat(300)}`,
      "URL_TOO_LONG",
    ],
  ])("AC-06: %s는 거부한다", (_, input, error) => {
    expect(normalizeUrl(input)).toEqual({ ok: false, error });
  });

  it("AC-06: 정확히 상한 길이인 URL은 허용한다", () => {
    const base = "https://a.com/";
    const input = base + "x".repeat(MAX_URL_LENGTH - base.length);

    expect(normalizeUrl(input)).toEqual({ ok: true, normalizedUrl: input });
  });
});
