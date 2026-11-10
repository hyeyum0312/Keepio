import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as oidc from "openid-client";
import request from "supertest";
import { AppModule } from "../app.module.js";
import type { OAuthProviderName } from "../config/env.js";
import { MailDispatcher } from "../mail/mail.dispatcher.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";
import { AuthRepository } from "./auth.repository.js";
import {
  type AuthorizationRequest,
  type CodeExchange,
  OAuthGateway,
  type OAuthIdentity,
} from "./oauth.gateway.js";
import { REFRESH_COOKIE } from "./refresh-cookie.js";

const WEB_ORIGIN = "http://localhost:7710";
const PASSWORD = "correct horse battery";
const CONCURRENT_CALLBACKS = 10;

// 실제 제공자처럼: 동의 화면 요청의 nonce·PKCE에 묶인 code를 발급하고, 교환 때 둘 다 확인한다
class FakeOAuthGateway extends OAuthGateway {
  enabled: OAuthProviderName[] = ["google", "kakao"];
  private readonly codes = new Map<
    string,
    { nonce: string; challenge: string; identity: OAuthIdentity }
  >();

  enabledProviders() {
    return this.enabled;
  }

  async authorizationUrl(_p: OAuthProviderName, req: AuthorizationRequest) {
    const url = new URL("https://idp.test/authorize");
    url.searchParams.set("redirect_uri", req.redirectUri);
    url.searchParams.set("state", req.state);
    url.searchParams.set("nonce", req.nonce);
    url.searchParams.set("code_challenge", req.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    return Promise.resolve(url);
  }

  // 사용자가 제공자에서 동의했을 때 받는 code
  issueCode(authorizeUrl: URL, identity: OAuthIdentity) {
    const code = randomUUID();
    this.codes.set(code, {
      nonce: authorizeUrl.searchParams.get("nonce")!,
      challenge: authorizeUrl.searchParams.get("code_challenge")!,
      identity,
    });
    return code;
  }

  async exchange(_p: OAuthProviderName, ex: CodeExchange) {
    const code = ex.callbackUrl.searchParams.get("code") ?? "";
    const entry = this.codes.get(code);
    this.codes.delete(code);
    if (!entry) throw new Error("unknown code");
    if (ex.callbackUrl.searchParams.get("state") !== ex.state) {
      throw new Error("state");
    }
    if (entry.nonce !== ex.nonce) throw new Error("nonce");
    if (
      (await oidc.calculatePKCECodeChallenge(ex.codeVerifier)) !==
      entry.challenge
    ) {
      throw new Error("pkce");
    }
    return entry.identity;
  }
}

describe("소셜 로그인 API (실제 PostgreSQL, 가짜 제공자, FEAT-004)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  let fake: FakeOAuthGateway;
  const createdEmails: string[] = [];
  const createdSubjects: string[] = [];
  let ipSeq = 0;

  beforeAll(async () => {
    vi.stubEnv("WEB_ORIGIN", WEB_ORIGIN);
    fake = new FakeOAuthGateway();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OAuthGateway)
      .useValue(fake)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app, { trustProxyHops: 1 });
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.get(MailDispatcher).drain();
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: createdEmails } },
          { oauthAccounts: { some: { subject: { in: createdSubjects } } } },
        ],
      },
    });
    await app.close();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    fake.enabled = ["google", "kakao"];
    vi.restoreAllMocks();
  });

  const nextIp = () => `10.1.${Math.floor(ipSeq / 250)}.${(ipSeq++ % 250) + 1}`;

  function newEmail() {
    const email = `o-${randomUUID()}@example.com`;
    createdEmails.push(email);
    return email;
  }

  function newSubject() {
    const subject = `sub-${randomUUID()}`;
    createdSubjects.push(subject);
    return subject;
  }

  function cookieOf(res: request.Response, name: string) {
    const all = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
    return all.find((c) => c.startsWith(`${name}=`));
  }

  async function start(provider: OAuthProviderName, ip = nextIp()) {
    const res = await request(baseUrl)
      .get(`/api/auth/oauth/${provider}/start`)
      .set("X-Forwarded-For", ip);
    return {
      res,
      ip,
      authorizeUrl: new URL(res.headers.location ?? "http://invalid"),
      flowCookie: cookieOf(res, "keepio_oauth")?.split(";")[0],
    };
  }

  function callback(
    provider: OAuthProviderName,
    params: Record<string, string>,
    flowCookie: string | undefined,
    ip = nextIp(),
  ) {
    const req = request(baseUrl)
      .get(`/api/auth/oauth/${provider}/callback`)
      .query(params)
      .set("X-Forwarded-For", ip);
    if (flowCookie) req.set("Cookie", flowCookie);
    return req;
  }

  // 시작 → 제공자 동의 → 콜백까지
  async function socialLogin(
    provider: OAuthProviderName,
    identity: OAuthIdentity,
  ) {
    const flow = await start(provider);
    const code = fake.issueCode(flow.authorizeUrl, identity);
    return callback(
      provider,
      { code, state: flow.authorizeUrl.searchParams.get("state")! },
      flow.flowCookie,
      flow.ip,
    );
  }

  async function userIdOf(provider: OAuthProviderName, subject: string) {
    const account = await prisma.oAuthAccount.findUniqueOrThrow({
      where: { provider_subject: { provider, subject } },
    });
    return account.userId;
  }

  function refreshWith(setCookie: string | undefined) {
    return request(baseUrl)
      .post("/api/auth/refresh")
      .set("Origin", WEB_ORIGIN)
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", setCookie?.split(";")[0] ?? "");
  }

  function passwordLogin(email: string) {
    return request(baseUrl)
      .post("/api/auth/login")
      .set("X-Forwarded-For", nextIp())
      .send({ email, password: PASSWORD });
  }

  describe("시작·콜백", () => {
    it("AC-05: 키가 있는 제공자 목록을 주고, 꺼진 제공자의 시작은 404", async () => {
      fake.enabled = ["google"];

      const list = await request(baseUrl).get("/api/auth/oauth/providers");
      const kakao = await start("kakao");
      const unknown = await request(baseUrl).get("/api/auth/oauth/naver/start");

      expect(list.body).toEqual({ providers: ["google"] });
      expect(kakao.res.status).toBe(404);
      expect(unknown.status).toBe(404);
    });

    it("AC-01: 시작하면 state·nonce·PKCE(S256)를 실어 제공자로 보내고, 원본은 서명된 HttpOnly 쿠키에만 둔다", async () => {
      const { res, authorizeUrl } = await start("google");

      expect(res.status).toBe(302);
      expect(authorizeUrl.origin).toBe("https://idp.test");
      for (const key of ["state", "nonce", "code_challenge"]) {
        expect(authorizeUrl.searchParams.get(key)).toMatch(/.{20,}/);
      }
      expect(authorizeUrl.searchParams.get("code_challenge_method")).toBe(
        "S256",
      );
      expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(
        "http://localhost:7711/api/auth/oauth/google/callback",
      );
      const cookie = cookieOf(res, "keepio_oauth") ?? "";
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Secure/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).toMatch(/Path=\/api\/auth\/oauth/i);
    });

    it("AC-02·AC-09: 처음 로그인하면 인증된 이메일로 새 계정을 만들고 세션 쿠키와 함께 웹 /auth/callback으로 보낸다", async () => {
      const email = newEmail();
      const subject = newSubject();

      const res = await socialLogin("google", {
        subject,
        email: email.toUpperCase(),
        emailVerified: true,
      });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${WEB_ORIGIN}/auth/callback`);
      expect(cookieOf(res, "keepio_oauth")).toMatch(/Expires=Thu, 01 Jan 1970/);
      const refresh = await refreshWith(cookieOf(res, REFRESH_COOKIE));
      expect(refresh.status).toBe(200);
      const me = await request(baseUrl)
        .get("/api/me")
        .set("Authorization", `Bearer ${refresh.body.accessToken}`);
      expect(me.body).toMatchObject({ email, emailVerified: true });
      expect(await userIdOf("google", subject)).toBe(me.body.id);
    });

    it.each<
      [
        string,
        (
          flow: Awaited<ReturnType<typeof start>>,
          code: string,
        ) => [Record<string, string>, string | undefined],
      ]
    >([
      [
        "state가 다르면",
        (f, code) => [{ code, state: "forged" }, f.flowCookie],
      ],
      [
        "흐름 쿠키가 없으면",
        (f, code) => [
          { code, state: f.authorizeUrl.searchParams.get("state")! },
          undefined,
        ],
      ],
      [
        "흐름 쿠키를 바꾸면",
        (f, code) => [
          { code, state: f.authorizeUrl.searchParams.get("state")! },
          `${f.flowCookie}x`,
        ],
      ],
    ])("AC-03: %s 세션 없이 /login?oauth=failed", async (_, tamper) => {
      const flow = await start("google");
      const code = fake.issueCode(flow.authorizeUrl, {
        subject: newSubject(),
        email: null,
        emailVerified: false,
      });
      const [params, cookie] = tamper(flow, code);

      const res = await callback("google", params, cookie, flow.ip);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${WEB_ORIGIN}/login?oauth=failed`);
      expect(cookieOf(res, REFRESH_COOKIE)).toBeUndefined();
    });

    it("AC-03: 다른 흐름에서 받은 code(nonce·PKCE 불일치)는 거부한다", async () => {
      const victim = await start("google");
      const attacker = await start("google");
      const attackerCode = fake.issueCode(attacker.authorizeUrl, {
        subject: newSubject(),
        email: null,
        emailVerified: false,
      });

      const res = await callback(
        "google",
        {
          code: attackerCode,
          state: victim.authorizeUrl.searchParams.get("state")!,
        },
        victim.flowCookie,
        victim.ip,
      );

      expect(res.headers.location).toBe(`${WEB_ORIGIN}/login?oauth=failed`);
    });

    it("AC-03: 다른 제공자의 흐름 쿠키는 거부한다", async () => {
      const flow = await start("google");

      const res = await callback(
        "kakao",
        { code: "c", state: flow.authorizeUrl.searchParams.get("state")! },
        flow.flowCookie,
      );

      expect(res.headers.location).toBe(`${WEB_ORIGIN}/login?oauth=failed`);
    });

    it("AC-04: 사용자가 동의를 거부하면 오류 없이 /login", async () => {
      const flow = await start("google");

      const res = await callback(
        "google",
        {
          error: "access_denied",
          state: flow.authorizeUrl.searchParams.get("state")!,
        },
        flow.flowCookie,
        flow.ip,
      );

      expect(res.headers.location).toBe(`${WEB_ORIGIN}/login`);
      expect(cookieOf(res, REFRESH_COOKIE)).toBeUndefined();
    });
  });

  describe("계정 결정", () => {
    async function passwordUser(verified: boolean) {
      const email = newEmail();
      await request(baseUrl)
        .post("/api/auth/signup")
        .set("X-Forwarded-For", nextIp())
        .send({ email, password: PASSWORD });
      if (verified) {
        await prisma.user.update({
          where: { email },
          data: { emailVerifiedAt: new Date() },
        });
      }
      const login = await passwordLogin(email);
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      return { email, userId: user.id, login };
    }

    it("AC-06: 이미 연결된 제공자 계정이면 이메일이 바뀌어도 같은 계정으로 로그인한다", async () => {
      const subject = newSubject();
      await socialLogin("google", {
        subject,
        email: newEmail(),
        emailVerified: true,
      });
      const first = await userIdOf("google", subject);

      const again = await socialLogin("google", {
        subject,
        email: newEmail(),
        emailVerified: true,
      });

      expect(again.headers.location).toBe(`${WEB_ORIGIN}/auth/callback`);
      expect(await userIdOf("google", subject)).toBe(first);
      expect(
        await prisma.oAuthAccount.count({ where: { userId: first } }),
      ).toBe(1);
    });

    it("AC-07: 인증된 기존 계정과 이메일이 같으면 연결하고, 비밀번호 로그인도 그대로 된다", async () => {
      const { email, userId } = await passwordUser(true);
      const subject = newSubject();

      await socialLogin("google", { subject, email, emailVerified: true });

      expect(await userIdOf("google", subject)).toBe(userId);
      expect((await passwordLogin(email)).status).toBe(200);
    });

    it("AC-08: 인증 안 된 기존 계정과 이메일이 같으면 연결하되 그 계정의 비밀번호·세션을 무효화한다", async () => {
      const { email, userId, login } = await passwordUser(false);
      const subject = newSubject();

      await socialLogin("google", { subject, email, emailVerified: true });

      expect(await userIdOf("google", subject)).toBe(userId);
      expect((await passwordLogin(email)).status).toBe(401);
      expect((await refreshWith(cookieOf(login, REFRESH_COOKIE))).status).toBe(
        401,
      );
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      expect(user.emailVerifiedAt).not.toBeNull();
    });

    it.each<[string, Partial<OAuthIdentity>]>([
      ["이메일이 없으면", { email: null, emailVerified: false }],
      ["이메일이 인증되지 않았으면", { emailVerified: false }],
    ])(
      "AC-09: 제공자 %s 기존 계정과 연결하지 않고 이메일 없는 새 계정을 만든다",
      async (_, override) => {
        const { email, userId } = await passwordUser(true);
        const subject = newSubject();

        await socialLogin("kakao", {
          subject,
          email,
          emailVerified: false,
          ...override,
        });

        const newUserId = await userIdOf("kakao", subject);
        expect(newUserId).not.toBe(userId);
        const created = await prisma.user.findUniqueOrThrow({
          where: { id: newUserId },
        });
        expect(created.email).toBeNull();
        expect((await passwordLogin(email)).status).toBe(200);
      },
    );

    it("AC-10: 같은 제공자 계정으로 콜백 10개가 동시에 와도 연결 1개·계정 1개이고 모두 로그인된다", async () => {
      const email = newEmail();
      const subject = newSubject();
      const identity = { subject, email, emailVerified: true };
      const flows = [];
      for (let i = 0; i < CONCURRENT_CALLBACKS; i++) {
        const flow = await start("google");
        flows.push({ flow, code: fake.issueCode(flow.authorizeUrl, identity) });
      }
      // 10개가 모두 계정 결정에 도착한 뒤 함께 진행시켜 UNIQUE 경합을 매번 일으킨다(동작은 그대로)
      const repo = app.get(AuthRepository);
      const resolve = repo.resolveOAuthUser.bind(repo);
      let arrived = 0;
      let releaseAll!: () => void;
      const allArrived = new Promise<void>((r) => (releaseAll = r));
      const spy = vi
        .spyOn(repo, "resolveOAuthUser")
        .mockImplementation(async (...args) => {
          if (++arrived === CONCURRENT_CALLBACKS) releaseAll();
          await allArrived;
          return resolve(...args);
        });

      const responses = await Promise.all(
        flows.map(({ flow, code }) =>
          callback(
            "google",
            { code, state: flow.authorizeUrl.searchParams.get("state")! },
            flow.flowCookie,
            flow.ip,
          ),
        ),
      );

      expect(spy).toHaveBeenCalledTimes(CONCURRENT_CALLBACKS);
      expect(responses.map((r) => r.headers.location)).toEqual(
        Array(CONCURRENT_CALLBACKS).fill(`${WEB_ORIGIN}/auth/callback`),
      );
      expect(
        await prisma.oAuthAccount.count({
          where: { provider: "google", subject },
        }),
      ).toBe(1);
      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });
  });
});
