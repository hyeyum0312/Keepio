import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

type SetupOptions = {
  webOrigin?: string;
};

// main.ts와 테스트가 같은 전역 설정을 쓰도록 한곳에 둔다
export function setupApp(
  app: INestApplication,
  { webOrigin }: SetupOptions = {},
) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  if (webOrigin) {
    app.enableCors({ origin: webOrigin, credentials: true });
  }

  const config = new DocumentBuilder()
    .setTitle("keepio API")
    .setVersion("0.1.0")
    .build();
  SwaggerModule.setup("docs", app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
