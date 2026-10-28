import { loadEnv } from "./env.js";

const VALID = { DATABASE_URL: "postgresql://u:secret@localhost:5432/db" };

describe("loadEnv", () => {
  it("필수 값만 있으면 기본값을 채운다", () => {
    expect(loadEnv(VALID)).toEqual({
      nodeEnv: "development",
      port: 7711,
      databaseUrl: VALID.DATABASE_URL,
      dbPoolMax: 10,
      webOrigin: undefined,
    });
  });

  it("잘못된 값을 모두 모아 한 번에 알린다", () => {
    expect(() =>
      loadEnv({ NODE_ENV: "staging", PORT: "abc", DB_POOL_MAX: "500" }),
    ).toThrow(/NODE_ENV[\s\S]*PORT[\s\S]*DB_POOL_MAX[\s\S]*DATABASE_URL/);
  });

  it("오류 메시지에 비밀값을 넣지 않는다", () => {
    const secretUrl = "mysql://u:topsecret@localhost/db";
    expect(() => loadEnv({ DATABASE_URL: secretUrl })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("topsecret"),
      }),
    );
  });

  it("WEB_ORIGIN이 http(s) URL이 아니면 거부한다", () => {
    expect(() =>
      loadEnv({ ...VALID, WEB_ORIGIN: "javascript:alert(1)" }),
    ).toThrow(/WEB_ORIGIN/);
  });
});
