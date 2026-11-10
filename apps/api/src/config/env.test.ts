import { loadEnv } from "./env.js";

const JWT_SECRET = "a".repeat(32);
const VALID = {
  DATABASE_URL: "postgresql://u:secret@localhost:5432/db",
  JWT_SECRET,
};
const PRODUCTION = {
  ...VALID,
  NODE_ENV: "production",
  WEB_ORIGIN: "https://keepio.example",
  RESEND_API_KEY: "re_test",
  MAIL_FROM: "keepio <no-reply@keepio.example>",
};

describe("loadEnv", () => {
  it("필수 값만 있으면 기본값을 채운다", () => {
    expect(loadEnv(VALID)).toEqual({
      nodeEnv: "development",
      port: 7711,
      databaseUrl: VALID.DATABASE_URL,
      dbPoolMax: 10,
      webOrigin: undefined,
      jwtSecret: JWT_SECRET,
      resendApiKey: undefined,
      mailFrom: undefined,
      trustProxyHops: 0,
      oauth: {},
      apiOrigin: "http://localhost:7711",
    });
  });

  it("잘못된 값을 모두 모아 한 번에 알린다", () => {
    expect(() =>
      loadEnv({ NODE_ENV: "staging", PORT: "abc", DB_POOL_MAX: "500" }),
    ).toThrow(
      /NODE_ENV[\s\S]*PORT[\s\S]*DB_POOL_MAX[\s\S]*DATABASE_URL[\s\S]*JWT_SECRET/,
    );
  });

  it("오류 메시지에 비밀값을 넣지 않는다", () => {
    const secretUrl = "mysql://u:topsecret@localhost/db";
    const shortSecret = "short-jwt-secret-value";
    expect(() =>
      loadEnv({ DATABASE_URL: secretUrl, JWT_SECRET: shortSecret }),
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringMatching(/topsecret|short-jwt-secret-value/),
      }),
    );
  });

  it("WEB_ORIGIN이 http(s) URL이 아니면 거부한다", () => {
    expect(() =>
      loadEnv({ ...VALID, WEB_ORIGIN: "javascript:alert(1)" }),
    ).toThrow(/WEB_ORIGIN/);
  });

  it.each(["development", "test", "production"])(
    "AC-19: %s에서도 JWT_SECRET이 없거나 32바이트 미만이면 거부한다",
    (nodeEnv) => {
      const base = nodeEnv === "production" ? PRODUCTION : VALID;
      expect(() =>
        loadEnv({ ...base, NODE_ENV: nodeEnv, JWT_SECRET: undefined }),
      ).toThrow(/JWT_SECRET/);
      expect(() =>
        loadEnv({ ...base, NODE_ENV: nodeEnv, JWT_SECRET: "a".repeat(31) }),
      ).toThrow(/JWT_SECRET/);
    },
  );

  it.each(["WEB_ORIGIN", "RESEND_API_KEY", "MAIL_FROM"])(
    "AC-19: 운영에서 %s가 없으면 거부한다",
    (name) => {
      expect(() => loadEnv({ ...PRODUCTION, [name]: undefined })).toThrow(
        new RegExp(`${name} is required in production`),
      );
    },
  );

  it("운영 필수 값이 모두 있으면 통과한다", () => {
    expect(loadEnv(PRODUCTION)).toMatchObject({
      nodeEnv: "production",
      resendApiKey: "re_test",
      mailFrom: PRODUCTION.MAIL_FROM,
    });
  });

  it("MAIL_FROM에 이메일 주소가 없으면 거부한다", () => {
    expect(() => loadEnv({ ...VALID, MAIL_FROM: "keepio" })).toThrow(
      /MAIL_FROM must contain/,
    );
  });

  it.each(["-1", "11", "abc"])(
    "TRUST_PROXY_HOPS가 0-10 정수가 아니면(%s) 거부한다",
    (value) => {
      expect(() => loadEnv({ ...VALID, TRUST_PROXY_HOPS: value })).toThrow(
        /TRUST_PROXY_HOPS/,
      );
    },
  );

  it("FEAT-004: ID·Secret이 모두 있는 소셜 제공자만 켠다", () => {
    const env = loadEnv({
      ...VALID,
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsecret",
    });
    expect(env.oauth).toEqual({
      google: { clientId: "gid", clientSecret: "gsecret" },
    });
  });

  it.each(["GOOGLE_CLIENT_ID", "KAKAO_CLIENT_SECRET"])(
    "FEAT-004: %s 하나만 있으면 거부하고 값은 메시지에 넣지 않는다",
    (name) => {
      expect(() => loadEnv({ ...VALID, [name]: "only-one-value" })).toThrow(
        expect.objectContaining({
          message: expect.stringMatching(/must be set together/),
        }),
      );
      expect(() => loadEnv({ ...VALID, [name]: "only-one-value" })).toThrow(
        expect.objectContaining({
          message: expect.not.stringContaining("only-one-value"),
        }),
      );
    },
  );

  it("FEAT-004: 운영에서 소셜 로그인을 켜면 API_ORIGIN이 필수다", () => {
    const withGoogle = {
      ...PRODUCTION,
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsecret",
    };
    expect(() => loadEnv(withGoogle)).toThrow(/API_ORIGIN is required/);
    expect(
      loadEnv({ ...withGoogle, API_ORIGIN: "https://api.keepio.example/" })
        .apiOrigin,
    ).toBe("https://api.keepio.example");
  });
});
