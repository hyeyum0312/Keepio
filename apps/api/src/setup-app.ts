import { type INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiErrorResponse } from "./common/api-error.js";
import { ApiExceptionFilter } from "./common/api-exception.filter.js";
import { requestContext } from "./common/request-context.js";

type SetupOptions = {
  webOrigin?: string;
  // 앞단 프록시 수. 0이면 X-Forwarded-For를 믿지 않는다(요청 제한의 IP 위조 방지)
  trustProxyHops?: number;
};

// main.ts와 테스트가 같은 전역 설정을 쓰도록 한곳에 둔다
export function setupApp(
  app: INestApplication,
  { webOrigin, trustProxyHops = 0 }: SetupOptions = {},
) {
  if (trustProxyHops > 0) {
    app.getHttpAdapter().getInstance().set("trust proxy", trustProxyHops);
  }
  // Refresh Token 쿠키(FEAT-003)
  app.use(cookieParser());
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
    // Access Token(FEAT-003). 보호된 API는 @ApiBearerAuth()로 표시한다
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config, {
    extraModels: [ApiErrorResponse],
  });
}
