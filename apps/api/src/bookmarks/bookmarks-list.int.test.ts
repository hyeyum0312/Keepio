import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { AccessTokenService } from "../auth/access-token.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";

const URL_A = "https://example.com/a";
const CONCURRENT_RESTORES = 10;

describe("링크 목록·삭제·복구 (실제 PostgreSQL, FEAT-002)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessTokens: AccessTokenService;
  let baseUrl: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    accessTokens = app.get(AccessTokenService);
  });

  afterAll(async () => {
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

  // 정렬 검증을 위해 시각을 직접 정해 넣는다
  function seed(
    userId: string,
    n: number,
    opts: { createdAt?: Date; deletedAt?: Date | null } = {},
  ) {
    return prisma.bookmark.create({
      data: {
        userId,
        originalUrl: `https://example.com/${n}`,
        normalizedUrl: `https://example.com/${n}`,
        createdAt: opts.createdAt ?? new Date(Date.UTC(2026, 0, 1, 0, 0, n)),
        deletedAt: opts.deletedAt ?? null,
      },
    });
  }

  async function as(userId: string) {
    const auth = `Bearer ${await accessTokens.sign(userId)}`;
    return {
      list: (query: Record<string, string | number> = {}) =>
        request(baseUrl)
          .get("/api/bookmarks")
          .query(query)
          .set("Authorization", auth),
      save: (url: string) =>
        request(baseUrl)
          .post("/api/bookmarks")
          .set("Authorization", auth)
          .send({ url }),
      remove: (id: string) =>
        request(baseUrl)
          .delete(`/api/bookmarks/${id}`)
          .set("Authorization", auth),
      restore: (id: string) =>
        request(baseUrl)
          .post(`/api/bookmarks/${id}/restore`)
          .set("Authorization", auth),
    };
  }

  const ids = (res: request.Response) =>
    (res.body.items as { id: string }[]).map((b) => b.id);

  it("AC-01·AC-07: 활성 북마크를 최근 저장 순으로 주고, 다른 사용자의 것은 없다", async () => {
    const [me, other] = [await newUser(), await newUser()];
    const old = await seed(me, 1);
    const recent = await seed(me, 3);
    await seed(me, 2, { deletedAt: new Date() });
    await seed(other, 4);
    const api = await as(me);

    const res = await api.list();

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([recent.id, old.id]);
    expect(res.body.nextCursor).toBeNull();
    expect(res.body.items[0]).toMatchObject({
      url: recent.originalUrl,
      deletedAt: null,
    });
  });

  it("AC-01: 저장 시각이 같으면 id 내림차순", async () => {
    const me = await newUser();
    const at = new Date(Date.UTC(2026, 0, 1));
    const a = await seed(me, 1, { createdAt: at });
    const b = await seed(me, 2, { createdAt: at });
    const api = await as(me);

    const res = await api.list();

    expect(ids(res)).toEqual([a.id, b.id].sort().reverse());
  });

  it("AC-02: limit씩 나눠 주고, 페이지 사이에 새로 저장해도 이미 본 항목이 중복·누락되지 않는다", async () => {
    const me = await newUser();
    const seeded = [];
    for (let n = 1; n <= 5; n++) seeded.push(await seed(me, n));
    const api = await as(me);

    const page1 = await api.list({ limit: 2 });
    await seed(me, 99, { createdAt: new Date(Date.UTC(2027, 0, 1)) }); // 가장 최근
    const page2 = await api.list({ limit: 2, cursor: page1.body.nextCursor });
    const page3 = await api.list({ limit: 2, cursor: page2.body.nextCursor });

    const expected = seeded.map((b) => b.id).reverse();
    expect([...ids(page1), ...ids(page2), ...ids(page3)]).toEqual(expected);
    expect(page3.body.nextCursor).toBeNull();
  });

  it("AC-02: 기본 20개", async () => {
    const me = await newUser();
    for (let n = 1; n <= 21; n++) await seed(me, n);
    const api = await as(me);

    const res = await api.list();

    expect(res.body.items).toHaveLength(20);
    expect(res.body.nextCursor).toEqual(expect.any(String));
  });

  it.each<[string, Record<string, string | number>]>([
    ["limit 0", { limit: 0 }],
    ["limit 51", { limit: 51 }],
    ["limit 숫자 아님", { limit: "abc" }],
    ["status 오류", { status: "all" }],
    ["커서 위조", { cursor: "not-a-cursor" }],
  ])("%s는 400 VALIDATION_FAILED", async (_, query) => {
    const api = await as(await newUser());

    const res = await api.list(query);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "입력한 내용을 확인해 주세요.",
    });
  });

  it("AC-03·AC-04: 삭제하면 204, 활성 목록에서 빠지고 휴지통에 최근 삭제 순으로 나타나며, 다시 삭제해도 204", async () => {
    const me = await newUser();
    const a = await seed(me, 1);
    const b = await seed(me, 2);
    const api = await as(me);

    expect((await api.remove(a.id)).status).toBe(204);
    expect((await api.remove(b.id)).status).toBe(204);
    expect((await api.remove(a.id)).status).toBe(204);

    expect(ids(await api.list())).toEqual([]);
    const trash = await api.list({ status: "deleted" });
    expect(ids(trash)).toEqual([b.id, a.id]);
    expect(trash.body.items[0].deletedAt).toEqual(expect.any(String));
  });

  it("AC-05: 복구하면 200과 북마크, 활성 목록에 돌아오고, 이미 활성이어도 200", async () => {
    const me = await newUser();
    const a = await seed(me, 1, { deletedAt: new Date() });
    const api = await as(me);

    const res = await api.restore(a.id);
    const again = await api.restore(a.id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: a.id, deletedAt: null });
    expect(again.status).toBe(200);
    expect(ids(await api.list())).toEqual([a.id]);
  });

  it("AC-06: 같은 링크가 이미 활성이면 복구하지 않고 409와 활성 북마크 ID", async () => {
    const me = await newUser();
    const deleted = await seed(me, 1, { deletedAt: new Date() });
    const active = await seed(me, 1, { createdAt: new Date() });
    const api = await as(me);

    const res = await api.restore(deleted.id);

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: "BOOKMARK_ALREADY_SAVED",
      message: "같은 링크가 이미 저장되어 있어요.",
      bookmarkId: active.id,
    });
    const still = await prisma.bookmark.findUniqueOrThrow({
      where: { id: deleted.id },
    });
    expect(still.deletedAt).not.toBeNull();
  });

  it("AC-06: 같은 링크의 삭제된 북마크 10개를 동시에 복구해도 활성은 1개다(부분 UNIQUE가 판정)", async () => {
    const me = await newUser();
    const rows = [];
    for (let i = 0; i < CONCURRENT_RESTORES; i++) {
      rows.push(await seed(me, 1, { deletedAt: new Date(Date.now() - i) }));
    }
    const api = await as(me);

    const responses = await Promise.all(rows.map((r) => api.restore(r.id)));

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(
      CONCURRENT_RESTORES - 1,
    );
    expect(
      await prisma.bookmark.count({ where: { userId: me, deletedAt: null } }),
    ).toBe(1);
  });

  it.each<[string, (other: string) => string]>([
    ["다른 사용자의 북마크", (other) => other],
    ["없는 ID", () => "00000000-0000-4000-8000-000000000000"],
    ["형식이 틀린 ID", () => "not-a-uuid"],
  ])(
    "AC-07: %s는 삭제·복구 모두 404이고 아무것도 바뀌지 않는다",
    async (_, pick) => {
      const [me, other] = [await newUser(), await newUser()];
      const theirs = await seed(other, 1);
      const api = await as(me);
      const id = pick(theirs.id);

      for (const res of [await api.remove(id), await api.restore(id)]) {
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          code: "BOOKMARK_NOT_FOUND",
          message: "링크를 찾을 수 없어요.",
        });
      }
      const unchanged = await prisma.bookmark.findUniqueOrThrow({
        where: { id: theirs.id },
      });
      expect(unchanged.deletedAt).toBeNull();
    },
  );

  it("AC-08: 삭제한 링크를 다시 저장하면 409 BOOKMARK_DELETED, 그 ID로 복구하면 활성이 된다", async () => {
    const me = await newUser();
    const api = await as(me);
    const saved = await api.save(URL_A);
    await api.remove(saved.body.id);

    const again = await api.save(URL_A);
    const restored = await api.restore(again.body.bookmarkId);

    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({
      code: "BOOKMARK_DELETED",
      bookmarkId: saved.body.id,
    });
    expect(restored.status).toBe(200);
    expect(ids(await api.list())).toEqual([saved.body.id]);
  });

  it("토큰이 없으면 목록·삭제·복구 모두 401", async () => {
    const id = "00000000-0000-4000-8000-000000000000";
    const responses = [
      await request(baseUrl).get("/api/bookmarks"),
      await request(baseUrl).delete(`/api/bookmarks/${id}`),
      await request(baseUrl).post(`/api/bookmarks/${id}/restore`),
    ];

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401]);
  });
});
