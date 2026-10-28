import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiErrorResponse } from "./common/api-error.js";
import { ApiExceptionFilter } from "./common/api-exception.filter.js";
import { requestContext } from "./common/request-context.js";

type SetupOptions = {
  webOrigin?: string;
};

// main.ts와 테스트가 같은 전역 설정을 쓰도록 한곳에 둔다
export function setupApp(
  app: INestApplication,
  { webOrigin }: SetupOptions = {},
) {
  app.use(requestContext);
  app.useGlobalFilters(new ApiExceptionFilter());
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

  SwaggerModule.setup("docs", app, () => createOpenApiDocument(app));
}

// /docs와 packages/api-client 생성(openapi-export.ts)이 같은 문서를 쓴다
export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("keepio API")
    .setVersion("0.1.0")
    .build();
  return SwaggerModule.createDocument(app, config, {
    extraModels: [ApiErrorResponse],
  });
}
