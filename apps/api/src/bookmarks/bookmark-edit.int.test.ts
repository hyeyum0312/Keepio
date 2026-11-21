import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { AccessTokenService } from "../auth/access-token.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";
import { LinkPreviewFetcher } from "./link-preview.fetcher.js";

// FEAT-011 제목 수정(실제 PostgreSQL). 썸네일 수집은 외부 요청이라 실패하는 가짜로 둔다
const OFFLINE_FETCHER = {
  fetchPage: () => Promise.reject(new Error("offline")),
  fetchImage: () => Promise.reject(new Error("offline")),
};

describe("PATCH /api/bookmarks/:id (FEAT-011)", () => {
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

  async function save(userId: string, body: object) {
    return request(app.getHttpServer())
      .post("/api/bookmarks")
      .set("Authorization", await auth(userId))
      .send(body);
  }

  async function patch(userId: string, id: string, body: object) {
    return request(app.getHttpServer())
      .patch(`/api/bookmarks/${id}`)
      .set("Authorization", await auth(userId))
      .send(body);
  }

  it("AC-01: 제목을 공백 정리해 바꾸고 표시 제목·출처(user)를 돌려준다. 목록에도 반영된다", async () => {
    const userId = await newUser();
    const saved = await save(userId, { url: "https://shop.example.com/p/1" });
    expect(saved.body.titleSource).toBe("site");

    const res = await patch(userId, saved.body.id, {
      title: "  다이어리   데이 체크 ",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: saved.body.id,
      title: "다이어리 데이 체크",
      displayTitle: "다이어리 데이 체크",
      titleSource: "user",
    });
    const list = await request(app.getHttpServer())
      .get("/api/bookmarks")
      .set("Authorization", await auth(userId));
    expect(list.body.items[0].displayTitle).toBe("다이어리 데이 체크");
  });

  it("AC-02: 비우거나 null이면 사용자 제목을 지우고 사이트 이름으로 돌아간다", async () => {
    const userId = await newUser();
    const saved = await save(userId, {
      url: "https://smartstore.naver.com/diaday/products/13854531009",
      title: "직접 넣은 제목",
    });
    expect(saved.body.titleSource).toBe("user");

    const cleared = await patch(userId, saved.body.id, { title: "   " });
    expect(cleared.status).toBe(200);
    expect(cleared.body).toMatchObject({
      title: null,
      displayTitle: "diaday · 스마트스토어",
      titleSource: "site",
    });

    const again = await patch(userId, saved.body.id, { title: null });
    expect(again.status).toBe(200);
    expect(again.body.title).toBeNull();
  });

  it("AC-03: 100자를 넘기면 400 VALIDATION_FAILED, title이 없거나 문자열이 아니면 400", async () => {
    const userId = await newUser();
    const saved = await save(userId, { url: "https://example.com/long" });

    const long = await patch(userId, saved.body.id, {
      title: "가".repeat(101),
    });
    expect(long.status).toBe(400);
    expect(long.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "제목은 100자까지 입력할 수 있어요.",
    });
    expect(
      (await patch(userId, saved.body.id, { title: "가".repeat(100) })).status,
    ).toBe(200);
    expect((await patch(userId, saved.body.id, {})).status).toBe(400);
    expect((await patch(userId, saved.body.id, { title: 3 })).status).toBe(400);
  });

  it("AC-03: 남의 링크·휴지통의 링크·없는 ID는 404", async () => {
    const owner = await newUser();
    const other = await newUser();
    const saved = await save(owner, { url: "https://example.com/mine" });

    const foreign = await patch(other, saved.body.id, { title: "x" });
    expect(foreign.status).toBe(404);
    expect(foreign.body.message).toBe("링크를 찾을 수 없어요.");

    await request(app.getHttpServer())
      .delete(`/api/bookmarks/${saved.body.id}`)
      .set("Authorization", await auth(owner));
    expect((await patch(owner, saved.body.id, { title: "x" })).status).toBe(
      404,
    );
    expect((await patch(owner, "not-a-uuid", { title: "x" })).status).toBe(404);
  });
});
