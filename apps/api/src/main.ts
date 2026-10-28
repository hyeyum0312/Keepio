import "reflect-metadata";
import { ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { loadEnv } from "./config/env.js";
import { setupApp } from "./setup-app.js";

// 로컬 개발은 저장소 루트 .env(dist/main.js 기준 ../../../.env), 운영은 환경 변수만 쓴다
try {
  process.loadEnvFile(new URL("../../../.env", import.meta.url));
} catch {
  // .env가 없으면 이미 설정된 환경 변수를 쓴다
}

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, {
    // 운영은 수집기가 읽는 JSON 한 줄 로그, 로컬은 사람이 읽는 형식
    logger: new ConsoleLogger({ json: env.nodeEnv === "production" }),
  });
  setupApp(app, { webOrigin: env.webOrigin });
  app.enableShutdownHooks();
  await app.listen(env.port);
}

void bootstrap();
