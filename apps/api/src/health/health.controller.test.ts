import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { setupApp } from "../setup-app.js";

describe("GET /health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("서버가 떠 있으면 status ok를 반환한다", async () => {
    const res = await request(app.getHttpServer()).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("OpenAPI 문서에 /health 경로가 포함된다", async () => {
    const res = await request(app.getHttpServer()).get("/docs-json");

    expect(res.status).toBe(200);
    expect(res.body.paths).toHaveProperty("/health");
  });
});
