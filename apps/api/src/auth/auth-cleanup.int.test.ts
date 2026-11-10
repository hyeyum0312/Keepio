import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuthCleanupTask, CLEANUP_GRACE_MS } from "./auth-cleanup.task.js";
import { generateToken, hashToken } from "./lib/token.js";

const DAY = 24 * 60 * 60 * 1000;

describe("AuthCleanupTask (실제 PostgreSQL, FEAT-003 Q-7)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let task: AuthCleanupTask;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
    prisma = app.get(PrismaService);
    task = app.get(AuthCleanupTask);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  async function newUser() {
    const user = await prisma.user.create({ data: {} });
    createdUserIds.push(user.id);
    return user.id;
  }

  async function refreshTokenExpiringAt(userId: string, expiresAt: Date) {
    const row = await prisma.refreshToken.create({
      data: {
        userId,
        familyId: randomUUID(),
        tokenHash: hashToken(generateToken()),
        expiresAt,
      },
    });
    return row.id;
  }

  async function emailTokenExpiringAt(userId: string, expiresAt: Date) {
    const row = await prisma.emailToken.create({
      data: {
        userId,
        purpose: "verify_email",
        tokenHash: hashToken(generateToken()),
        expiresAt,
      },
    });
    return row.id;
  }

  it("만료 후 하루가 지난 토큰만 지우고, 만료 직후·유효한 토큰은 남긴다", async () => {
    const userId = await newUser();
    // 다른 테스트 데이터와 겹치지 않도록 먼 미래를 기준 시각으로 쓴다
    const now = new Date(Date.now() + 3650 * DAY);
    const old = new Date(now.getTime() - CLEANUP_GRACE_MS - 1000);
    const recent = new Date(now.getTime() - CLEANUP_GRACE_MS + 60_000);
    const valid = new Date(now.getTime() + DAY);
    const oldRefresh = await refreshTokenExpiringAt(userId, old);
    const recentRefresh = await refreshTokenExpiringAt(userId, recent);
    const validRefresh = await refreshTokenExpiringAt(userId, valid);
    const oldEmail = await emailTokenExpiringAt(userId, old);
    const validEmail = await emailTokenExpiringAt(userId, valid);

    await task.cleanup(now);

    const refreshLeft = await prisma.refreshToken.findMany({
      where: { userId },
      select: { id: true },
    });
    const emailLeft = await prisma.emailToken.findMany({
      where: { userId },
      select: { id: true },
    });
    expect(refreshLeft.map((r) => r.id).sort()).toEqual(
      [recentRefresh, validRefresh].sort(),
    );
    expect(refreshLeft.map((r) => r.id)).not.toContain(oldRefresh);
    expect(emailLeft.map((r) => r.id)).toEqual([validEmail]);
    expect(emailLeft.map((r) => r.id)).not.toContain(oldEmail);
  });

  it("묶음 크기보다 많아도 반복해서 모두 지운다", async () => {
    const userId = await newUser();
    const now = new Date(Date.now() + 3650 * DAY);
    const old = new Date(now.getTime() - CLEANUP_GRACE_MS - 1000);
    for (let i = 0; i < 7; i++) await refreshTokenExpiringAt(userId, old);

    const deleted = await task.cleanup(now, 3);

    expect(deleted.refreshTokens).toBeGreaterThanOrEqual(7);
    expect(await prisma.refreshToken.count({ where: { userId } })).toBe(0);
  });
});
