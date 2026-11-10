import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { MailSender } from "../mail/mail.sender.js";
import { MemoryMailSender } from "../mail/memory-mail.sender.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";
import { AuthThrottlerGuard } from "./auth-throttler.guard.js";
import { AuthRepository } from "./auth.repository.js";
import { REFRESH_COOKIE } from "./refresh-cookie.js";

const WEB_ORIGIN = "http://localhost:7710";
const PASSWORD = "correct horse battery";
const CONCURRENT_SIGNUPS = 10;

describe("인증 API (실제 PostgreSQL, FEAT-003)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mail: MemoryMailSender;
  let baseUrl: string;
  const createdEmails: string[] = [];
  let ipSeq = 0;

  beforeAll(async () => {
    // Origin 검사·메일 링크가 쓰는 값. CI에는 .env가 없다
    vi.stubEnv("WEB_ORIGIN", WEB_ORIGIN);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailSender)
      .useValue(new MemoryMailSender())
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    // 테스트마다 다른 IP(X-Forwarded-For)로 요청 제한 카운트를 분리한다
    setupApp(app, { trustProxyHops: 1 });
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    mail = app.get(MailSender);
  });

  afterAll(async () => {
    // 인증 데이터는 사용자 삭제 시 CASCADE로 지워진다
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    await app.close();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function newEmail() {
    const email = `u-${randomUUID()}@example.com`;
    createdEmails.push(email);
    return email;
  }

  // 클라이언트 하나 = IP 하나
  function client(
    ip = `10.0.${Math.floor(ipSeq / 250)}.${(ipSeq++ % 250) + 1}`,
  ) {
    const post = (path: string, body?: object, cookie?: string) => {
      const req = request(baseUrl)
        .post(path)
        .set("X-Forwarded-For", ip)
        .set("Origin", WEB_ORIGIN);
      if (cookie) req.set("Cookie", cookie);
      return req.send(body);
    };
    const me = (accessToken: string) =>
      request(baseUrl)
        .get("/api/me")
        .set("Authorization", `Bearer ${accessToken}`);
    return { post, me };
  }

  function tokenIn(to: string, subjectPart: string) {
    const message = mail
      .to(to)
      .reverse()
      .find((m) => m.subject.includes(subjectPart));
    const token = /token=([A-Za-z0-9_-]{43})/.exec(message?.text ?? "")?.[1];
    if (!token) throw new Error(`no ${subjectPart} mail for ${to}`);
    return token;
  }

  function refreshCookieOf(res: request.Response) {
    const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
    return cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
  }

  // Set-Cookie에서 요청에 실을 "이름=값"만
  function cookiePair(res: request.Response) {
    return refreshCookieOf(res)?.split(";")[0];
  }

  async function signupAndLogin(c = client()) {
    const email = newEmail();
    await c.post("/api/auth/signup", { email, password: PASSWORD });
    const login = await c.post("/api/auth/login", {
      email,
      password: PASSWORD,
    });
    return { email, login, c };
  }

  describe("가입·이메일 인증", () => {
    it("AC-01: 가입하면 202, argon2id 해시만 저장하고 인증 메일을 보낸다", async () => {
      const email = newEmail();

      const res = await client().post("/api/auth/signup", {
        email,
        password: PASSWORD,
      });

      expect(res.status).toBe(202);
      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { passwordCredential: true },
      });
      expect(user.emailVerifiedAt).toBeNull();
      expect(user.passwordCredential?.passwordHash).toMatch(/^\$argon2id\$/);
      expect(user.passwordCredential?.passwordHash).not.toContain(PASSWORD);
      expect(tokenIn(email, "인증")).toHaveLength(43);
    });

    it("AC-02: 이메일은 정규화해서 저장한다", async () => {
      const email = newEmail();

      await client().post("/api/auth/signup", {
        email: `  ${email.toUpperCase()} `,
        password: PASSWORD,
      });

      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });

    it.each([
      [
        "이메일 형식 오류",
        { email: "not-an-email", password: PASSWORD },
        "INVALID_EMAIL",
        "올바른 이메일 주소가 아니에요.",
      ],
      [
        "비밀번호 7자",
        { email: "x@example.com", password: "1234567" },
        "WEAK_PASSWORD",
        "비밀번호는 8자 이상 128자 이하로 입력해 주세요.",
      ],
      [
        "비밀번호 129자",
        { email: "x@example.com", password: "a".repeat(129) },
        "WEAK_PASSWORD",
        "비밀번호는 8자 이상 128자 이하로 입력해 주세요.",
      ],
    ])(
      "AC-02: %s면 400이고 아무것도 저장하지 않는다",
      async (_, body, code, message) => {
        const before = await prisma.user.count();

        const res = await client().post("/api/auth/signup", body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ code, message });
        expect(await prisma.user.count()).toBe(before);
      },
    );

    it("AC-03: 이미 가입된 이메일이면 같은 202, 계정은 그대로, 안내 메일을 보낸다", async () => {
      const email = newEmail();
      await client().post("/api/auth/signup", { email, password: PASSWORD });

      const again = await client().post("/api/auth/signup", {
        email,
        password: "another password",
      });

      expect(again.status).toBe(202);
      expect(again.body).toEqual({});
      expect(await prisma.user.count({ where: { email } })).toBe(1);
      expect(mail.to(email).at(-1)?.subject).toContain("이미 가입된");
      // 기존 비밀번호가 그대로다
      const login = await client().post("/api/auth/login", {
        email,
        password: PASSWORD,
      });
      expect(login.status).toBe(200);
    });

    it("AC-04: 같은 이메일로 가입 10개를 동시에 보내도 계정은 1개다", async () => {
      const email = newEmail();
      // 이 테스트는 DB 경합만 본다. 같은 이메일 메일 제한(시간당 3회, 아래 AC-16에서 검증)이 4번째부터 막으므로 여기서만 끈다
      vi.spyOn(AuthThrottlerGuard.prototype, "canActivate").mockResolvedValue(
        true,
      );
      // 10개가 모두 저장소에 도착한 뒤 함께 INSERT하게 해 경합을 매번 일으킨다(동작은 그대로)
      const repo = app.get(AuthRepository);
      const create = repo.createPasswordUser.bind(repo);
      let arrived = 0;
      let releaseAll!: () => void;
      const allArrived = new Promise<void>((r) => (releaseAll = r));
      const spy = vi
        .spyOn(repo, "createPasswordUser")
        .mockImplementation(async (...args) => {
          if (++arrived === CONCURRENT_SIGNUPS) releaseAll();
          await allArrived;
          return create(...args);
        });

      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_SIGNUPS }, () =>
          client().post("/api/auth/signup", { email, password: PASSWORD }),
        ),
      );

      expect(spy).toHaveBeenCalledTimes(CONCURRENT_SIGNUPS);
      expect(responses.every((r) => r.status === 202)).toBe(true);
      expect(await prisma.user.count({ where: { email } })).toBe(1);
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(
        await prisma.emailToken.count({ where: { userId: user.id } }),
      ).toBe(1);
    });

    it("AC-05·AC-06: 인증 링크로 인증하면 204, /api/me의 emailVerified가 true가 된다", async () => {
      const { email, login, c } = await signupAndLogin();
      const before = await c.me(login.body.accessToken);
      expect(before.body.emailVerified).toBe(false);

      const res = await c.post("/api/auth/email-verification", {
        token: tokenIn(email, "인증"),
      });

      expect(res.status).toBe(204);
      const after = await c.me(login.body.accessToken);
      expect(after.body).toEqual({
        id: expect.any(String),
        email,
        emailVerified: true,
      });
    });

    it("AC-05: 인증 토큰은 한 번만 쓸 수 있다", async () => {
      const email = newEmail();
      const c = client();
      await c.post("/api/auth/signup", { email, password: PASSWORD });
      const token = tokenIn(email, "인증");
      await c.post("/api/auth/email-verification", { token });

      const again = await c.post("/api/auth/email-verification", { token });

      expect(again.status).toBe(400);
      expect(again.body).toMatchObject({
        code: "INVALID_TOKEN",
        message: "링크가 만료되었거나 이미 사용되었어요. 다시 요청해 주세요.",
      });
    });

    it("AC-05: 만료된 토큰과 형식이 다른 토큰은 400 INVALID_TOKEN", async () => {
      const email = newEmail();
      const c = client();
      await c.post("/api/auth/signup", { email, password: PASSWORD });
      await prisma.emailToken.updateMany({
        where: { user: { email } },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const expired = await c.post("/api/auth/email-verification", {
        token: tokenIn(email, "인증"),
      });
      const malformed = await c.post("/api/auth/email-verification", {
        token: "abc",
      });

      expect(expired.body.code).toBe("INVALID_TOKEN");
      expect(malformed.body.code).toBe("INVALID_TOKEN");
    });

    it("인증 메일 재발송은 항상 202이고, 인증 전 계정에만 새 링크를 보낸다", async () => {
      const email = newEmail();
      const c = client();
      await c.post("/api/auth/signup", { email, password: PASSWORD });
      const unknown = newEmail();

      const known = await c.post("/api/auth/email-verification/resend", {
        email,
      });
      const missing = await c.post("/api/auth/email-verification/resend", {
        email: unknown,
      });

      expect([known.status, missing.status]).toEqual([202, 202]);
      expect(mail.to(email)).toHaveLength(2);
      expect(mail.to(unknown)).toHaveLength(0);
    });
  });

  describe("로그인·세션", () => {
    it("AC-07: 로그인하면 Access Token과 HttpOnly·Secure·SameSite=Lax 쿠키를 주고, 토큰으로 /api/me를 부를 수 있다", async () => {
      const { email, login, c } = await signupAndLogin();

      expect(login.status).toBe(200);
      expect(login.body).toEqual({
        accessToken: expect.any(String),
        expiresIn: 900,
      });
      const cookie = refreshCookieOf(login) ?? "";
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Secure/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).toMatch(/Path=\/api\/auth/i);
      expect(JSON.stringify(login.body)).not.toContain(
        cookie.split(";")[0].split("=")[1],
      );
      const me = await c.me(login.body.accessToken);
      expect(me.body.email).toBe(email);
    });

    it("AC-08: 없는 이메일과 틀린 비밀번호는 같은 401과 같은 문구", async () => {
      const { email } = await signupAndLogin();

      const wrong = await client().post("/api/auth/login", {
        email,
        password: "wrong password",
      });
      const unknown = await client().post("/api/auth/login", {
        email: newEmail(),
        password: PASSWORD,
      });

      for (const res of [wrong, unknown]) {
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
          code: "INVALID_CREDENTIALS",
          message: "이메일 또는 비밀번호가 맞지 않아요.",
        });
        expect(refreshCookieOf(res)).toBeUndefined();
      }
    });

    it("AC-09: 토큰 없이 /api/me를 부르면 401 UNAUTHENTICATED", async () => {
      const res = await request(baseUrl).get("/api/me");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHENTICATED");
    });

    it("AC-10: refresh는 쿠키로 새 Access Token과 새 쿠키를 준다", async () => {
      const { login, c } = await signupAndLogin();
      const first = cookiePair(login);

      const res = await c.post("/api/auth/refresh", undefined, first);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      const second = cookiePair(res);
      expect(second).toBeDefined();
      expect(second).not.toBe(first);
      expect((await c.me(res.body.accessToken)).status).toBe(200);
    });

    it("refresh 쿠키가 없거나 쓸 수 없으면 401 SESSION_EXPIRED와 함께 쿠키를 지운다", async () => {
      const res = await client().post(
        "/api/auth/refresh",
        undefined,
        `${REFRESH_COOKIE}=${"A".repeat(43)}`,
      );

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        code: "SESSION_EXPIRED",
        message: "다시 로그인해 주세요.",
      });
      expect(refreshCookieOf(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("다른 출처(Origin)에서 온 refresh·logout은 403 INVALID_ORIGIN", async () => {
      const { login } = await signupAndLogin();

      for (const path of ["/api/auth/refresh", "/api/auth/logout"]) {
        const res = await request(baseUrl)
          .post(path)
          .set("Origin", "https://evil.example")
          .set("Cookie", cookiePair(login) ?? "");
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("INVALID_ORIGIN");
      }
      // 거부된 요청이 세션을 바꾸지 않았다
      const ok = await client().post(
        "/api/auth/refresh",
        undefined,
        cookiePair(login),
      );
      expect(ok.status).toBe(200);
    });

    it("AC-13: 로그아웃하면 204와 쿠키 삭제, 그 쿠키로는 더 이상 갱신할 수 없고 다시 해도 204", async () => {
      const { login, c } = await signupAndLogin();
      const cookie = cookiePair(login);

      const res = await c.post("/api/auth/logout", undefined, cookie);
      const again = await c.post("/api/auth/logout", undefined, cookie);
      const refresh = await c.post("/api/auth/refresh", undefined, cookie);

      expect(res.status).toBe(204);
      expect(refreshCookieOf(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(again.status).toBe(204);
      expect(refresh.status).toBe(401);
    });
  });

  describe("비밀번호 재설정", () => {
    it("AC-14: 재설정 요청은 항상 202, 가입된 주소에만 메일을 보낸다", async () => {
      const { email } = await signupAndLogin();
      const unknown = newEmail();

      const known = await client().post("/api/auth/password-reset", { email });
      const missing = await client().post("/api/auth/password-reset", {
        email: unknown,
      });

      expect([known.status, missing.status]).toEqual([202, 202]);
      expect(mail.to(email).at(-1)?.subject).toContain("재설정");
      expect(mail.to(unknown)).toHaveLength(0);
    });

    it("AC-15: 재설정하면 새 비밀번호로만 로그인되고, 기존 세션이 모두 끊기고, 이메일이 인증된다", async () => {
      const { email, login, c } = await signupAndLogin();
      await c.post("/api/auth/password-reset", { email });

      const res = await c.post("/api/auth/password-reset/confirm", {
        token: tokenIn(email, "재설정"),
        newPassword: "brand new password",
      });

      expect(res.status).toBe(204);
      const oldRefresh = await c.post(
        "/api/auth/refresh",
        undefined,
        cookiePair(login),
      );
      expect(oldRefresh.status).toBe(401);
      const oldLogin = await c.post("/api/auth/login", {
        email,
        password: PASSWORD,
      });
      expect(oldLogin.status).toBe(401);
      const newLogin = await c.post("/api/auth/login", {
        email,
        password: "brand new password",
      });
      expect(newLogin.status).toBe(200);
      expect((await c.me(newLogin.body.accessToken)).body.emailVerified).toBe(
        true,
      );
    });

    it("AC-15: 새 비밀번호가 정책에 맞지 않으면 400 WEAK_PASSWORD이고 토큰은 그대로 쓸 수 있다", async () => {
      const { email, c } = await signupAndLogin();
      await c.post("/api/auth/password-reset", { email });
      const token = tokenIn(email, "재설정");

      const weak = await c.post("/api/auth/password-reset/confirm", {
        token,
        newPassword: "short",
      });
      const retry = await c.post("/api/auth/password-reset/confirm", {
        token,
        newPassword: "long enough password",
      });

      expect(weak.body.code).toBe("WEAK_PASSWORD");
      expect(retry.status).toBe(204);
    });

    it("AC-15: 재설정 토큰은 한 번만 쓸 수 있고, 인증 토큰으로는 재설정할 수 없다", async () => {
      const { email, c } = await signupAndLogin();
      await c.post("/api/auth/password-reset", { email });
      const resetToken = tokenIn(email, "재설정");
      await c.post("/api/auth/password-reset/confirm", {
        token: resetToken,
        newPassword: "brand new password",
      });

      const reused = await c.post("/api/auth/password-reset/confirm", {
        token: resetToken,
        newPassword: "another new password",
      });
      const wrongPurpose = await c.post("/api/auth/password-reset/confirm", {
        token: tokenIn(email, "인증"),
        newPassword: "another new password",
      });

      expect(reused.body.code).toBe("INVALID_TOKEN");
      expect(wrongPurpose.body.code).toBe("INVALID_TOKEN");
    });
  });

  describe("요청 제한(AC-16)", () => {
    it("같은 IP의 로그인은 1분에 10번까지, 11번째는 429 TOO_MANY_ATTEMPTS", async () => {
      const c = client();
      const statuses: number[] = [];
      for (let i = 0; i < 11; i++) {
        const res = await c.post("/api/auth/login", {
          email: newEmail(),
          password: PASSWORD,
        });
        statuses.push(res.status);
        if (res.status === 429) {
          expect(res.body).toMatchObject({
            code: "TOO_MANY_ATTEMPTS",
            message: "시도가 너무 많아요. 잠시 후 다시 시도해 주세요.",
          });
        }
      }

      expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
      expect(statuses[10]).toBe(429);
    });

    it("같은 이메일의 로그인은 IP가 달라도 15분에 5번까지", async () => {
      const email = newEmail();
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await client().post("/api/auth/login", {
          email: i % 2 ? email.toUpperCase() : email,
          password: "wrong password",
        });
        statuses.push(res.status);
      }

      expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    });

    it("메일 발송은 가입·재발송·재설정을 합쳐 이메일당 1시간에 3번까지", async () => {
      const email = newEmail();

      const statuses = [
        (await client().post("/api/auth/signup", { email, password: PASSWORD }))
          .status,
        (await client().post("/api/auth/email-verification/resend", { email }))
          .status,
        (await client().post("/api/auth/password-reset", { email })).status,
        (await client().post("/api/auth/password-reset", { email })).status,
      ];

      expect(statuses).toEqual([202, 202, 202, 429]);
      expect(mail.to(email)).toHaveLength(3);
    });

    it("refresh는 요청 제한을 받지 않는다(여러 탭의 정상 갱신)", async () => {
      const { login, c } = await signupAndLogin();
      let cookie = cookiePair(login);
      for (let i = 0; i < 12; i++) {
        const res = await c.post("/api/auth/refresh", undefined, cookie);
        expect(res.status).toBe(200);
        cookie = cookiePair(res);
      }
    });
  });
});
