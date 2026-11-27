import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { AccessTokenService } from "../auth/access-token.service.js";
import { LinkPreviewFetcher } from "../bookmarks/link-preview.fetcher.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";
import { CategoriesRepository } from "./categories.repository.js";

// FEAT-008 카테고리 만들기·적용(실제 PostgreSQL). 썸네일 수집은 외부 요청이라 실패하는 가짜로 둔다
const OFFLINE_FETCHER = {
  fetchPage: () => Promise.reject(new Error("offline")),
  fetchImage: () => Promise.reject(new Error("offline")),
};

describe("/api/categories (FEAT-008)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessTokens: AccessTokenService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LinkPreviewFetcher)
      .useValue(OFFLINE_FETCHER)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    accessTokens = app.get(AccessTokenService);
  });

  afterAll(async () => {
    await prisma.bookmark.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.category.deleteMany({
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

  async function auth(userId: string) {
    return `Bearer ${await accessTokens.sign(userId)}`;
  }

  async function patchCategory(userId: string, id: string, body: object) {
    return request(app.getHttpServer())
      .patch(`/api/categories/${id}`)
      .set("Authorization", await auth(userId))
      .send(body);
  }

  async function create(userId: string, name: string) {
    return request(app.getHttpServer())
      .post("/api/categories")
      .set("Authorization", await auth(userId))
      .send({ name });
  }

  async function list(userId: string) {
    return request(app.getHttpServer())
      .get("/api/categories")
      .set("Authorization", await auth(userId));
  }

  async function save(userId: string, url: string) {
    return request(app.getHttpServer())
      .post("/api/bookmarks")
      .set("Authorization", await auth(userId))
      .send({ url });
  }

  async function patch(userId: string, id: string, body: object) {
    return request(app.getHttpServer())
      .patch(`/api/bookmarks/${id}`)
      .set("Authorization", await auth(userId))
      .send(body);
  }

  it("AC-01: 만들면 이름순으로 나오고 링크 수가 함께 온다", async () => {
    const userId = await newUser();
    await create(userId, "여행");
    await create(userId, "디자인");
    const created = await create(userId, "개발");
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "개발", bookmarkCount: 0 });

    const saved = await save(userId, "https://example.com/dev/1");
    await patch(userId, saved.body.id, { categoryId: created.body.id });

    const res = await list(userId);
    expect(res.status).toBe(200);
    expect(res.body.items.map((c: { name: string }) => c.name)).toEqual([
      "개발",
      "디자인",
      "여행",
    ]);
    expect(res.body.items[0].bookmarkCount).toBe(1);
  });

  it("AC-01: 휴지통의 링크는 링크 수에서 빠진다", async () => {
    const userId = await newUser();
    const category = await create(userId, "읽을거리");
    const saved = await save(userId, "https://example.com/read/1");
    await patch(userId, saved.body.id, { categoryId: category.body.id });

    await request(app.getHttpServer())
      .delete(`/api/bookmarks/${saved.body.id}`)
      .set("Authorization", await auth(userId));

    const res = await list(userId);
    expect(res.body.items[0]).toMatchObject({
      name: "읽을거리",
      bookmarkCount: 0,
    });
  });

  it("AC-02: 공백·대소문자만 다른 이름은 409와 기존 ID를 돌려준다", async () => {
    const userId = await newUser();
    const first = await create(userId, "TRAVEL");

    for (const name of ["  travel  ", "Travel", "TRAVEL"]) {
      const res = await create(userId, name);
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        code: "CATEGORY_DUPLICATE",
        message: "이미 같은 이름의 카테고리가 있어요.",
        categoryId: first.body.id,
      });
    }
    expect((await list(userId)).body.items).toHaveLength(1);
  });

  it("AC-02: 자모가 분리된 한글(NFD)도 같은 이름으로 본다", async () => {
    const userId = await newUser();
    const first = await create(userId, "여행");
    const res = await create(userId, "여행".normalize("NFD"));
    expect(res.status).toBe(409);
    expect(res.body.categoryId).toBe(first.body.id);
  });

  it("AC-02: 이름이 비었거나 20자를 넘으면 400", async () => {
    const userId = await newUser();
    for (const name of ["", "   ", "가".repeat(21)]) {
      const res = await create(userId, name);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        code: "VALIDATION_FAILED",
        message: "카테고리 이름은 1~20자로 입력해 주세요.",
      });
    }
    expect((await list(userId)).body.items).toHaveLength(0);
  });

  it("AC-07: 다른 사용자의 카테고리는 보이지 않고, 링크에 걸 수도 없다(404)", async () => {
    const mine = await newUser();
    const other = await newUser();
    const theirs = await create(other, "남의 카테고리");

    expect((await list(mine)).body.items).toHaveLength(0);

    const saved = await save(mine, "https://example.com/mine/1");
    const res = await patch(mine, saved.body.id, {
      categoryId: theirs.body.id,
    });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: "NOT_FOUND",
      message: "카테고리를 찾을 수 없어요.",
    });
  });

  it("AC-07: 카테고리 ID가 UUID가 아니거나 없는 ID면 404", async () => {
    const userId = await newUser();
    const saved = await save(userId, "https://example.com/mine/2");
    const missing = await patch(userId, saved.body.id, {
      categoryId: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing.status).toBe(404);
    // UUID 형식이 아니면 DTO가 먼저 거른다
    const bad = await patch(userId, saved.body.id, { categoryId: "nope" });
    expect(bad.status).toBe(400);
  });

  it("AC-08: 같은 이름을 동시에 보내도 하나만 생기고 나머지는 409와 그 ID를 받는다", async () => {
    const userId = await newUser();
    const repo = app.get(CategoriesRepository);
    const original = repo.create.bind(repo);
    let waiting = 0;
    let release: () => void = () => {};
    const everyoneReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    // 경합을 강제한다: 세 요청이 모두 INSERT 직전에 모일 때까지 기다린다(QUALITY.md)
    const spy = vi
      .spyOn(repo, "create")
      .mockImplementation(async (uid, input) => {
        if (++waiting === 3) release();
        await everyoneReady;
        return original(uid, input);
      });

    const results = await Promise.all([
      create(userId, "여행"),
      create(userId, "여행"),
      create(userId, "여행"),
    ]);
    spy.mockRestore();

    expect(waiting).toBe(3);
    const created = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);
    expect(created).toHaveLength(1);
    expect(conflicts).toHaveLength(2);
    for (const res of conflicts) {
      expect(res.body.categoryId).toBe(created[0].body.id);
    }
    expect((await list(userId)).body.items).toHaveLength(1);
  });

  it("AC-09: 링크를 다른 카테고리로 옮기고, null이면 미분류가 된다. 제목은 그대로다", async () => {
    const userId = await newUser();
    const design = await create(userId, "디자인");
    const dev = await create(userId, "개발");
    const saved = await save(userId, "https://example.com/move/1");
    await patch(userId, saved.body.id, { title: "옮길 링크" });

    const toDesign = await patch(userId, saved.body.id, {
      categoryId: design.body.id,
    });
    expect(toDesign.body).toMatchObject({
      categoryId: design.body.id,
      title: "옮길 링크",
    });

    const toDev = await patch(userId, saved.body.id, {
      categoryId: dev.body.id,
    });
    expect(toDev.body.categoryId).toBe(dev.body.id);

    const uncategorized = await patch(userId, saved.body.id, {
      categoryId: null,
    });
    expect(uncategorized.body).toMatchObject({
      categoryId: null,
      title: "옮길 링크",
    });
  });

  it("AC-09: 카테고리만 보내면 제목이 지워지지 않는다(제목만 보내도 카테고리 유지)", async () => {
    const userId = await newUser();
    const category = await create(userId, "메모");
    const saved = await save(userId, "https://example.com/keep/1");
    await patch(userId, saved.body.id, { title: "제목" });
    await patch(userId, saved.body.id, { categoryId: category.body.id });

    const res = await patch(userId, saved.body.id, { title: "바뀐 제목" });
    expect(res.body).toMatchObject({
      title: "바뀐 제목",
      categoryId: category.body.id,
    });
  });

  it("AC-14: 고정 → 한글 → 영문 → 숫자 → 그 밖 순서로, 같은 종류 안에서는 이름순", async () => {
    const userId = await newUser();
    for (const name of ["#임시", "2026 결산", "Design", "하늘", "가방"]) {
      await create(userId, name);
    }

    const before = await list(userId);
    expect(before.body.items.map((c: { name: string }) => c.name)).toEqual([
      "가방",
      "하늘",
      "Design",
      "2026 결산",
      "#임시",
    ]);

    // 맨 뒤의 "#임시"를 고정하면 맨 앞으로 온다
    const temp = before.body.items.at(-1);
    const pinned = await patchCategory(userId, temp.id, { pinned: true });
    expect(pinned.status).toBe(200);
    expect(pinned.body).toMatchObject({ name: "#임시", pinned: true });

    const after = await list(userId);
    expect(after.body.items.map((c: { name: string }) => c.name)).toEqual([
      "#임시",
      "가방",
      "하늘",
      "Design",
      "2026 결산",
    ]);
  });

  it("AC-15: 고정·해제는 멱등이고, 고정한 순서를 지킨다", async () => {
    const userId = await newUser();
    const a = await create(userId, "가방");
    const b = await create(userId, "하늘");

    // 나중에 고정한 것이 뒤로 온다
    await patchCategory(userId, b.body.id, { pinned: true });
    await patchCategory(userId, a.body.id, { pinned: true });
    expect(
      (await list(userId)).body.items.map((c: { name: string }) => c.name),
    ).toEqual(["하늘", "가방"]);

    // 같은 값을 다시 보내도 성공한다(멱등)
    const again = await patchCategory(userId, a.body.id, { pinned: true });
    expect(again.status).toBe(200);
    expect(again.body.pinned).toBe(true);

    const off = await patchCategory(userId, b.body.id, { pinned: false });
    expect(off.body.pinned).toBe(false);
    const offAgain = await patchCategory(userId, b.body.id, { pinned: false });
    expect(offAgain.status).toBe(200);
    expect(offAgain.body.pinned).toBe(false);
  });

  it("AC-15: 고정은 8개까지이고 넘기면 422. 남의 카테고리는 404", async () => {
    const userId = await newUser();
    const ids: string[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await create(userId, `카테고리 ${i}`);
      ids.push(res.body.id);
    }
    for (const id of ids.slice(0, 8)) {
      expect((await patchCategory(userId, id, { pinned: true })).status).toBe(
        200,
      );
    }

    const over = await patchCategory(userId, ids[8], { pinned: true });
    expect(over.status).toBe(422);
    expect(over.body).toMatchObject({
      code: "CATEGORY_PIN_LIMIT",
      message: "고정은 8개까지 할 수 있어요.",
    });
    // 해제는 상한과 무관하다
    expect(
      (await patchCategory(userId, ids[0], { pinned: false })).status,
    ).toBe(200);
    expect((await patchCategory(userId, ids[8], { pinned: true })).status).toBe(
      200,
    );

    const other = await newUser();
    expect((await patchCategory(other, ids[0], { pinned: true })).status).toBe(
      404,
    );
  });

  it("AC-16: 링크 응답은 카테고리 이름까지 담는다(미분류는 null)", async () => {
    const userId = await newUser();
    const category = await create(userId, "디자인");
    const saved = await save(userId, "https://example.com/name/1");
    expect(saved.body.category).toBeNull();

    const applied = await patchCategory(userId, category.body.id, {});
    expect(applied.status).toBe(200);

    const patched = await patch(userId, saved.body.id, {
      categoryId: category.body.id,
    });
    expect(patched.body.category).toEqual({
      id: category.body.id,
      name: "디자인",
    });

    // 목록에도 같은 값이 온다
    const listed = await request(app.getHttpServer())
      .get("/api/bookmarks")
      .set("Authorization", await auth(userId));
    expect(listed.body.items[0].category).toEqual({
      id: category.body.id,
      name: "디자인",
    });

    // 미분류로 되돌리면 null
    const cleared = await patch(userId, saved.body.id, { categoryId: null });
    expect(cleared.body.category).toBeNull();
  });

  async function listIds(userId: string, query: string) {
    const res = await request(app.getHttpServer())
      .get(`/api/bookmarks?${query}`)
      .set("Authorization", await auth(userId));
    expect(res.status).toBe(200);
    return (res.body.items as { id: string }[]).map((b) => b.id);
  }

  it("AC-11: 목록을 카테고리·미분류로 거른다. 둘을 함께 주거나 값이 틀리면 400", async () => {
    const userId = await newUser();
    const travel = await create(userId, "여행");
    const inTravel = await save(userId, "https://example.com/filter/a");
    await patch(userId, inTravel.body.id, { categoryId: travel.body.id });
    const loose = await save(userId, "https://example.com/filter/b");

    expect(await listIds(userId, `categoryId=${travel.body.id}`)).toEqual([
      inTravel.body.id,
    ]);
    expect(await listIds(userId, "uncategorized=true")).toEqual([
      loose.body.id,
    ]);
    // false는 거르지 않는다
    expect(await listIds(userId, "uncategorized=false")).toEqual([
      loose.body.id,
      inTravel.body.id,
    ]);

    for (const query of [
      `categoryId=${travel.body.id}&uncategorized=true`,
      "uncategorized=yes",
      "categoryId=not-a-uuid",
    ]) {
      const res = await request(app.getHttpServer())
        .get(`/api/bookmarks?${query}`)
        .set("Authorization", await auth(userId));
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_FAILED");
    }
  });

  it("AC-11: 남의 카테고리로 거르면 빈 목록이고, 휴지통도 카테고리로 거른다", async () => {
    const owner = await newUser();
    const other = await newUser();
    const theirs = await create(owner, "비밀");
    const link = await save(owner, "https://example.com/filter/secret");
    await patch(owner, link.body.id, { categoryId: theirs.body.id });

    expect(await listIds(other, `categoryId=${theirs.body.id}`)).toEqual([]);

    await request(app.getHttpServer())
      .delete(`/api/bookmarks/${link.body.id}`)
      .set("Authorization", await auth(owner));
    expect(
      await listIds(owner, `status=deleted&categoryId=${theirs.body.id}`),
    ).toEqual([link.body.id]);
    expect(await listIds(owner, `categoryId=${theirs.body.id}`)).toEqual([]);
  });

  it("AC-11: 카테고리로 거른 목록도 키셋 페이지가 끊김 없이 이어진다", async () => {
    const userId = await newUser();
    const cat = await create(userId, "페이지");
    const ids: string[] = [];
    for (const n of [1, 2, 3]) {
      const res = await save(userId, `https://example.com/page/${n}`);
      await patch(userId, res.body.id, { categoryId: cat.body.id });
      ids.unshift(res.body.id);
    }
    await save(userId, "https://example.com/page/other");

    const first = await request(app.getHttpServer())
      .get(`/api/bookmarks?categoryId=${cat.body.id}&limit=2`)
      .set("Authorization", await auth(userId));
    const second = await request(app.getHttpServer())
      .get(
        `/api/bookmarks?categoryId=${cat.body.id}&limit=2&cursor=${encodeURIComponent(first.body.nextCursor)}`,
      )
      .set("Authorization", await auth(userId));
    expect(
      [...first.body.items, ...second.body.items].map(
        (b: { id: string }) => b.id,
      ),
    ).toEqual(ids);
    expect(second.body.nextCursor).toBeNull();
  });

  it("칩 줄 수: 목록은 활성 링크 전체 수와 미분류 수를 함께 준다(휴지통 제외)", async () => {
    const userId = await newUser();
    expect((await list(userId)).body).toMatchObject({
      items: [],
      totalCount: 0,
      uncategorizedCount: 0,
    });

    const cat = await create(userId, "여행");
    const a = await save(userId, "https://example.com/count/a");
    await patch(userId, a.body.id, { categoryId: cat.body.id });
    await save(userId, "https://example.com/count/b");
    const trashed = await save(userId, "https://example.com/count/c");
    await request(app.getHttpServer())
      .delete(`/api/bookmarks/${trashed.body.id}`)
      .set("Authorization", await auth(userId));

    expect((await list(userId)).body).toMatchObject({
      totalCount: 2,
      uncategorizedCount: 1,
    });
  });

  async function remove(userId: string, id: string) {
    return request(app.getHttpServer())
      .delete(`/api/categories/${id}`)
      .set("Authorization", await auth(userId));
  }

  it("AC-04: 카테고리를 지우면 링크는 남고 미분류가 된다(휴지통 링크 포함)", async () => {
    const userId = await newUser();
    const travel = await create(userId, "여행");
    const active = await save(userId, "https://example.com/del/a");
    const trashed = await save(userId, "https://example.com/del/b");
    await patch(userId, active.body.id, { categoryId: travel.body.id });
    await patch(userId, trashed.body.id, { categoryId: travel.body.id });
    await request(app.getHttpServer())
      .delete(`/api/bookmarks/${trashed.body.id}`)
      .set("Authorization", await auth(userId));

    const res = await remove(userId, travel.body.id);
    expect(res.status).toBe(204);

    const rows = await prisma.bookmark.findMany({
      where: { id: { in: [active.body.id, trashed.body.id] } },
      select: { categoryId: true, deletedAt: true },
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.categoryId === null)).toBe(true);
    expect((await list(userId)).body).toMatchObject({
      items: [],
      totalCount: 1,
      uncategorizedCount: 1,
    });
    // 같은 이름으로 다시 만들 수 있다
    expect((await create(userId, "여행")).status).toBe(201);
  });

  it("AC-04·07: 이미 지웠거나 없거나 남의 카테고리를 지우면 404이고 남의 것은 그대로다", async () => {
    const owner = await newUser();
    const other = await newUser();
    const theirs = await create(owner, "비밀");
    const mine = await create(other, "내 것");
    await remove(other, mine.body.id);

    for (const id of [
      theirs.body.id,
      mine.body.id,
      "00000000-0000-4000-8000-000000000000",
      "not-a-uuid",
    ]) {
      const res = await remove(other, id);
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        code: "NOT_FOUND",
        message: "카테고리를 찾을 수 없어요.",
      });
    }
    expect(await prisma.category.count({ where: { id: theirs.body.id } })).toBe(
      1,
    );
  });

  it("AC-12: 100개를 넘기면 422", async () => {
    const userId = await newUser();
    await prisma.category.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        userId,
        name: `카테고리 ${i}`,
        normalizedName: `카테고리 ${i}`,
      })),
    });

    const res = await create(userId, "101번째");
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      code: "CATEGORY_LIMIT",
      message: "카테고리는 100개까지 만들 수 있어요.",
    });
  });
});
