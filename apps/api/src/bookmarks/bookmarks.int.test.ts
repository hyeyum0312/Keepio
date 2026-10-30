import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { DEV_USER_HEADER } from "../auth/user.guard.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";
import { BookmarksRepository } from "./bookmarks.repository.js";

const URL_A = "https://example.com/article?id=1";
const CONCURRENT_REQUESTS = 100;

describe("POST /api/bookmarks (실제 PostgreSQL, FEAT-001)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    // 동시 요청 테스트가 서버 하나를 공유하도록 실제 포트로 띄운다
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // 테스트마다 새 사용자를 만들어 격리하고, 끝나면 그 사용자 데이터만 지운다
    await prisma.bookmark.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  async function newUser() {
    const user = await prisma.user.create({ data: {} });
    createdUserIds.push(user.id);
    return user.id;
  }

  function save(userId: string, body: unknown) {
    return request(baseUrl)
      .post("/api/bookmarks")
      .set(DEV_USER_HEADER, userId)
      .send(body as object);
  }

  function countBookmarks(userId: string) {
    return prisma.bookmark.count({ where: { userId } });
  }

  it("AC-01: 처음 저장하는 URL은 북마크를 만들고 201과 ID를 반환한다", async () => {
    const userId = await newUser();

    const res = await save(userId, { url: URL_A });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      url: URL_A,
      normalizedUrl: URL_A,
      createdAt: expect.any(String),
    });
    expect(await countBookmarks(userId)).toBe(1);
  });

  it("AC-02: 정규화 결과가 같은 URL을 다시 저장하면 기존 ID를 200으로 반환한다", async () => {
    const userId = await newUser();
    const first = await save(userId, { url: URL_A });

    const again = await save(userId, {
      url: "HTTPS://Example.com:443/article?id=1&utm_source=kakao",
    });

    expect(again.status).toBe(200);
    expect(again.body.id).toBe(first.body.id);
    expect(await countBookmarks(userId)).toBe(1);
  });

  it("AC-03: 같은 URL 저장 요청 100개를 동시에 보내도 활성 북마크는 1개이고 모든 ID가 같다", async () => {
    const userId = await newUser();
    // HTTP 요청은 연결 시차로 앞 요청이 먼저 끝나 경합이 일어나지 않을 때가 있다(ON CONFLICT를 빼도 5회 중 4회 통과).
    // 100개가 모두 사전 조회를 "마친" 뒤(모두 없음을 본 상태) 함께 진행시켜, 매번 100개가 INSERT를 시도하게 한다.
    // 조회 전에 모으면 풀(10개) 대기 때문에 늦은 조회가 먼저 저장된 행을 봐서 INSERT를 건너뛸 수 있다(CI에서 99회).
    // 동작은 바꾸지 않고 시점만 맞춘다
    const repo = app.get(BookmarksRepository);
    const findLatest = repo.findLatestByUrl.bind(repo);
    let arrived = 0;
    let releaseAll!: () => void;
    const allArrived = new Promise<void>((resolve) => (releaseAll = resolve));
    vi.spyOn(repo, "findLatestByUrl").mockImplementation(async (...args) => {
      const latest = await findLatest(...args);
      if (++arrived === CONCURRENT_REQUESTS) releaseAll();
      await allArrived;
      return latest;
    });
    const insertSpy = vi.spyOn(repo, "insertIfAbsent");

    try {
      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, () =>
          save(userId, { url: URL_A }),
        ),
      );

      expect(insertSpy).toHaveBeenCalledTimes(CONCURRENT_REQUESTS);
      const statuses = responses.map((res) => res.status);
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 200)).toHaveLength(
        CONCURRENT_REQUESTS - 1,
      );
      expect(new Set(responses.map((res) => res.body.id)).size).toBe(1);
      expect(
        await prisma.bookmark.count({ where: { userId, deletedAt: null } }),
      ).toBe(1);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("AC-04: 다른 사용자가 같은 URL을 저장하면 각자 별도 북마크가 생긴다", async () => {
    const [userA, userB] = [await newUser(), await newUser()];

    const a = await save(userA, { url: URL_A });
    const b = await save(userB, { url: URL_A });

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.id).not.toBe(b.body.id);
  });

  it.each([
    [
      "javascript 스킴",
      "javascript:alert(1)",
      "UNSUPPORTED_SCHEME",
      "http나 https로 시작하는 링크만 저장할 수 있어요.",
    ],
    ["빈 문자열", "", "INVALID_URL", "올바른 링크 주소가 아니에요."],
    [
      "2048자 초과",
      `https://a.com/${"x".repeat(2048)}`,
      "URL_TOO_LONG",
      "링크 주소가 너무 길어요.",
    ],
  ])(
    "AC-06: %s는 400 %s와 승인된 문구로 거부하고 저장하지 않는다",
    async (_, url, code, message) => {
      const userId = await newUser();

      const res = await save(userId, { url });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code, message });
      expect(await countBookmarks(userId)).toBe(0);
    },
  );

  it("AC-06: url이 없으면 400 VALIDATION_FAILED로 거부한다", async () => {
    const userId = await newUser();

    const res = await save(userId, {});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_FAILED");
  });

  it("AC-07: 삭제된 북마크와 같은 URL을 저장하면 409와 복구할 ID를 반환하고 새로 만들지 않는다", async () => {
    const userId = await newUser();
    const first = await save(userId, { url: URL_A });
    await prisma.bookmark.update({
      where: { id: first.body.id },
      data: { deletedAt: new Date() },
    });

    const res = await save(userId, { url: `${URL_A}&utm_source=x` });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: "BOOKMARK_DELETED",
      message: "삭제한 링크예요. 복구할 수 있어요.",
      bookmarkId: first.body.id,
    });
    expect(await countBookmarks(userId)).toBe(1);
  });

  it("AC-07: 활성 북마크가 있으면 삭제된 행이 있어도 AC-02가 우선한다", async () => {
    const userId = await newUser();
    await prisma.bookmark.create({
      data: {
        userId,
        originalUrl: URL_A,
        normalizedUrl: URL_A,
        deletedAt: new Date(),
      },
    });
    const active = await prisma.bookmark.create({
      data: { userId, originalUrl: URL_A, normalizedUrl: URL_A },
    });

    const res = await save(userId, { url: URL_A });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(active.id);
  });

  it("사용자를 식별할 수 없으면 401로 거부하고 저장하지 않는다", async () => {
    const res = await request(baseUrl)
      .post("/api/bookmarks")
      .send({ url: URL_A });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요해요.",
    });
  });

  it("DB CHECK 제약이 앱 검증과 별개로 2048자 초과 URL을 막는다", async () => {
    const userId = await newUser();
    const tooLong = `https://a.com/${"x".repeat(2048)}`;

    await expect(
      prisma.bookmark.create({
        data: { userId, originalUrl: tooLong, normalizedUrl: tooLong },
      }),
    ).rejects.toThrow();
    expect(await countBookmarks(userId)).toBe(0);
  });
});
