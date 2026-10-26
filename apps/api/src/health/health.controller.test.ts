import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";

// DB는 외부 경계라 단위 테스트에서는 대체한다. 실제 DB는 *.int.test.ts에서 검증한다.
const fakePrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
};

describe("GET /health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("DB에 연결되면 200과 db up을 반환한다", async () => {
    fakePrisma.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await request(app.getHttpServer()).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "up" });
  });

  it("DB 조회가 실패하면 503과 db down을 반환한다", async () => {
    fakePrisma.$queryRaw.mockRejectedValueOnce(new Error("connection refused"));

    const res = await request(app.getHttpServer()).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "error", db: "down" });
  });

  it("OpenAPI 문서에 /health 경로가 포함된다", async () => {
    const res = await request(app.getHttpServer()).get("/docs-json");

    expect(res.status).toBe(200);
    expect(res.body.paths).toHaveProperty("/health");
  });
});
