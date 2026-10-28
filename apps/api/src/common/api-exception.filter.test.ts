import { Body, Controller, Get, HttpStatus, Post } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { IsUrl } from "class-validator";
import request from "supertest";
import { setupApp } from "../setup-app.js";
import { ApiException } from "./api-error.js";

class EchoDto {
  @IsUrl()
  url!: string;
}

@Controller("probe")
class ProbeController {
  @Post("echo")
  echo(@Body() body: EchoDto) {
    return body;
  }

  @Get("domain")
  domain() {
    throw new ApiException(HttpStatus.CONFLICT, "BOOKMARK_DELETED", "deleted");
  }

  @Get("crash")
  crash() {
    throw new Error("db password leaked?");
  }
}

describe("오류 응답 형태와 요청 ID", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("입력 검증 실패는 VALIDATION_FAILED와 상세 메시지를 반환한다", async () => {
    const res = await request(app.getHttpServer())
      .post("/probe/echo")
      .send({ url: "not a url", extra: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      code: "VALIDATION_FAILED",
      requestId: res.headers["x-request-id"],
    });
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });

  it("도메인 예외는 지정한 상태와 code를 그대로 쓴다", async () => {
    const res = await request(app.getHttpServer()).get("/probe/domain");

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: "BOOKMARK_DELETED",
      message: "deleted",
    });
  });

  it("없는 경로는 쿼리를 되돌려주지 않고 NOT_FOUND를 반환한다", async () => {
    const res = await request(app.getHttpServer()).get("/nope?token=secret");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });

  it("처리하지 못한 오류는 원인을 숨기고 INTERNAL_ERROR를 반환한다", async () => {
    const res = await request(app.getHttpServer()).get("/probe/crash");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId: res.headers["x-request-id"],
    });
  });

  it("형식이 맞는 x-request-id는 그대로 쓰고, 아니면 새로 만든다", async () => {
    const kept = await request(app.getHttpServer())
      .get("/nope")
      .set("x-request-id", "client-req-12345");
    const replaced = await request(app.getHttpServer())
      .get("/nope")
      .set("x-request-id", "bad id <script>");

    expect(kept.headers["x-request-id"]).toBe("client-req-12345");
    expect(kept.body.requestId).toBe("client-req-12345");
    expect(replaced.headers["x-request-id"]).not.toBe("bad id <script>");
    expect(replaced.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
