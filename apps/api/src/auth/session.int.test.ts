import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AccessTokenService } from "./access-token.service.js";
import { AuthRepository } from "./auth.repository.js";
import { hashToken } from "./lib/token.js";
import {
  REFRESH_TOKEN_TTL_MS,
  ROTATION_GRACE_MS,
  SessionService,
} from "./session.service.js";

const CONCURRENT_REFRESHES = 20;
const SESSION_EXPIRED = {
  code: "SESSION_EXPIRED",
  message: "다시 로그인해 주세요.",
};

describe("SessionService (실제 PostgreSQL, FEAT-003)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sessions: SessionService;
  let accessTokens: AccessTokenService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
    prisma = app.get(PrismaService);
    sessions = app.get(SessionService);
    accessTokens = app.get(AccessTokenService);
  });

  afterAll(async () => {
    // 토큰은 사용자 삭제 시 CASCADE로 지워진다
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function newUser() {
    const user = await prisma.user.create({ data: {} });
    createdUserIds.push(user.id);
    return user.id;
  }

  function stored(refreshToken: string) {
    return prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: hashToken(refreshToken) },
    });
  }

  // 유예 시간이 지난 것처럼 사용 시각을 앞당긴다(시계를 조작하지 않고 데이터만 바꾼다)
  async function ageUsedAt(refreshToken: string) {
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(refreshToken) },
      data: { usedAt: new Date(Date.now() - ROTATION_GRACE_MS - 1000) },
    });
  }

  it("AC-07: 발급하면 Access Token과 Refresh Token을 주고 DB에는 해시만 저장한다", async () => {
    const userId = await newUser();

    const session = await sessions.issue(userId);

    await expect(accessTokens.verify(session.accessToken)).resolves.toBe(
      userId,
    );
    expect(session.expiresIn).toBe(15 * 60);
    const row = await stored(session.refreshToken);
    expect(row.userId).toBe(userId);
    expect(Buffer.from(row.tokenHash).toString()).not.toContain(
      session.refreshToken,
    );
    const ttl = row.expiresAt.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(REFRESH_TOKEN_TTL_MS - 60_000);
    expect(ttl).toBeLessThanOrEqual(REFRESH_TOKEN_TTL_MS);
  });

  it("AC-10: 회전하면 새 토큰을 주고 이전 토큰은 사용됨, 같은 묶음·같은 만료 시각을 물려준다", async () => {
    const userId = await newUser();
    const first = await sessions.issue(userId);

    const second = await sessions.rotate(first.refreshToken);

    expect(second.refreshToken).not.toBe(first.refreshToken);
    await expect(accessTokens.verify(second.accessToken)).resolves.toBe(userId);
    const [old, next] = [
      await stored(first.refreshToken),
      await stored(second.refreshToken),
    ];
    expect(old.usedAt).not.toBeNull();
    expect(next.familyId).toBe(old.familyId);
    expect(next.expiresAt).toEqual(old.expiresAt);
    expect(second.refreshExpiresAt).toEqual(old.expiresAt);
  });

  it("AC-11: 유예 시간이 지난 뒤 사용된 토큰이 다시 오면 묶음 전체를 폐기하고 최신 토큰도 거부한다", async () => {
    const userId = await newUser();
    const first = await sessions.issue(userId);
    const second = await sessions.rotate(first.refreshToken);
    await ageUsedAt(first.refreshToken);

    await expect(sessions.rotate(first.refreshToken)).rejects.toMatchObject(
      SESSION_EXPIRED,
    );

    expect((await stored(second.refreshToken)).revokedAt).not.toBeNull();
    await expect(sessions.rotate(second.refreshToken)).rejects.toMatchObject(
      SESSION_EXPIRED,
    );
  });

  it("AC-12: 같은 토큰으로 동시에 20번 회전해도 1번만 성공하고, 진 요청 때문에 묶음이 폐기되지 않는다", async () => {
    const userId = await newUser();
    const { refreshToken } = await sessions.issue(userId);
    // 20개가 모두 저장소에 도착한 뒤 함께 진행시켜 같은 행 갱신 경합을 매번 일으킨다(동작은 그대로, 시점만 맞춤)
    const repo = app.get(AuthRepository);
    const rotate = repo.rotateRefreshToken.bind(repo);
    let arrived = 0;
    let releaseAll!: () => void;
    const allArrived = new Promise<void>((resolve) => (releaseAll = resolve));
    const spy = vi
      .spyOn(repo, "rotateRefreshToken")
      .mockImplementation(async (...args) => {
        if (++arrived === CONCURRENT_REFRESHES) releaseAll();
        await allArrived;
        return rotate(...args);
      });

    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT_REFRESHES }, () =>
        sessions.rotate(refreshToken),
      ),
    );

    expect(spy).toHaveBeenCalledTimes(CONCURRENT_REFRESHES);
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r) => r.status === "rejected");
    expect(won).toHaveLength(1);
    for (const r of lost) {
      expect(r.reason).toMatchObject(SESSION_EXPIRED);
    }
    const family = (await stored(refreshToken)).familyId;
    expect(
      await prisma.refreshToken.count({ where: { familyId: family } }),
    ).toBe(2);
    expect(
      await prisma.refreshToken.count({
        where: { familyId: family, revokedAt: { not: null } },
      }),
    ).toBe(0);
    vi.restoreAllMocks();
    // 승자가 받은 새 토큰은 계속 쓸 수 있다
    const winner = (won[0] as PromiseFulfilledResult<{ refreshToken: string }>)
      .value;
    await expect(sessions.rotate(winner.refreshToken)).resolves.toBeDefined();
  });

  it("만료된 Refresh Token은 거부한다", async () => {
    const userId = await newUser();
    const { refreshToken } = await sessions.issue(userId);
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(sessions.rotate(refreshToken)).rejects.toMatchObject(
      SESSION_EXPIRED,
    );
  });

  it.each([
    ["없으면", undefined],
    ["형식이 다르면", "not-a-token"],
    ["저장된 적 없으면", "A".repeat(43)],
  ])("Refresh Token이 %s 거부한다", async (_, token) => {
    await expect(sessions.rotate(token)).rejects.toMatchObject(SESSION_EXPIRED);
  });

  it("AC-13: 로그아웃하면 묶음을 폐기하고, 다시 해도 성공한다", async () => {
    const userId = await newUser();
    const first = await sessions.issue(userId);
    const second = await sessions.rotate(first.refreshToken);

    await sessions.revoke(second.refreshToken);
    await expect(sessions.revoke(second.refreshToken)).resolves.toBeUndefined();
    await expect(sessions.revoke(undefined)).resolves.toBeUndefined();

    await expect(sessions.rotate(second.refreshToken)).rejects.toMatchObject(
      SESSION_EXPIRED,
    );
    expect((await stored(first.refreshToken)).revokedAt).not.toBeNull();
  });

  it("로그아웃은 같은 사용자의 다른 로그인(다른 묶음)에 영향을 주지 않는다", async () => {
    const userId = await newUser();
    const laptop = await sessions.issue(userId);
    const phone = await sessions.issue(userId);

    await sessions.revoke(laptop.refreshToken);

    await expect(sessions.rotate(phone.refreshToken)).resolves.toBeDefined();
  });
});
