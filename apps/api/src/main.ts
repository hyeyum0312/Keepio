import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { setupApp } from "./setup-app.js";

const DEFAULT_PORT = 7711;

// 로컬 개발은 저장소 루트 .env(dist/main.js 기준 ../../../.env), 운영은 환경 변수만 쓴다
try {
  process.loadEnvFile(new URL("../../../.env", import.meta.url));
} catch {
  // .env가 없으면 이미 설정된 환경 변수를 쓴다
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app, { webOrigin: process.env.WEB_ORIGIN });
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? DEFAULT_PORT));
}

void bootstrap();
