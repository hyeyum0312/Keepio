import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { setupApp } from "./setup-app.js";

const DEFAULT_PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app, { webOrigin: process.env.WEB_ORIGIN });
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? DEFAULT_PORT));
}

void bootstrap();
