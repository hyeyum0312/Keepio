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
