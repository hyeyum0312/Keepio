import {
  flowCookieKey,
  type OAuthFlow,
  openFlow,
  sealFlow,
} from "./oauth-flow-cookie.js";

const KEY = flowCookieKey("s".repeat(32));
const NOW = 1_000_000;
const FLOW: OAuthFlow = {
  provider: "google",
  state: "state-1",
  nonce: "nonce-1",
  codeVerifier: "verifier-1",
  expiresAt: NOW + 60_000,
};

describe("OAuth 흐름 쿠키 (FEAT-004)", () => {
  it("AC-01: 봉인한 값을 같은 제공자·만료 전이면 그대로 연다", () => {
    expect(openFlow(sealFlow(FLOW, KEY), KEY, "google", NOW)).toEqual(FLOW);
  });

  it("AC-01: 쿠키 값에 원문이 그대로 보이지 않는다(서명 포함)", () => {
    const value = sealFlow(FLOW, KEY);
    expect(value.split(".")).toHaveLength(2);
    expect(value).not.toContain("verifier-1");
  });

  it.each<[string, (v: string) => string]>([
    [
      "본문을 바꾸면",
      (v) =>
        `${Buffer.from(JSON.stringify({ ...FLOW, state: "x" })).toString("base64url")}.${v.split(".")[1]}`,
    ],
    ["서명을 바꾸면", (v) => `${v.split(".")[0]}.AAAA`],
    ["점이 더 있으면", (v) => `${v}.extra`],
    ["형식이 아니면", () => "not-a-cookie"],
  ])("AC-03: %s 거부한다", (_, tamper) => {
    expect(
      openFlow(tamper(sealFlow(FLOW, KEY)), KEY, "google", NOW),
    ).toBeNull();
  });

  it("AC-03: 다른 키로 서명한 값은 거부한다", () => {
    const other = flowCookieKey("x".repeat(32));
    expect(openFlow(sealFlow(FLOW, other), KEY, "google", NOW)).toBeNull();
  });

  it("AC-03: 다른 제공자의 쿠키는 거부한다", () => {
    expect(openFlow(sealFlow(FLOW, KEY), KEY, "kakao", NOW)).toBeNull();
  });

  it("AC-03: 만료됐거나 없으면 거부한다", () => {
    expect(
      openFlow(sealFlow(FLOW, KEY), KEY, "google", FLOW.expiresAt),
    ).toBeNull();
    expect(openFlow(undefined, KEY, "google", NOW)).toBeNull();
  });
});
