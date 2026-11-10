import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { loadEnv } from "../config/env.js";
import { MailModule } from "../mail/mail.module.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AccessTokenService,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "./access-token.service.js";
import { AuthCleanupTask } from "./auth-cleanup.task.js";
import { AUTH_THROTTLERS } from "./auth-throttler.guard.js";
import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { MeController } from "./me.controller.js";
import { SessionService } from "./session.service.js";
import { UserGuard } from "./user.guard.js";

@Module({
  imports: [
    MailModule,
    ThrottlerModule.forRoot({ throttlers: AUTH_THROTTLERS }),
    // 검증 시 알고리즘을 고정한다(alg 바꿔치기 방지). 비밀값은 시작 시 loadEnv가 검증한다
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: loadEnv().jwtSecret,
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
        verifyOptions: {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
      }),
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    AuthCleanupTask,
    AuthRepository,
    AuthService,
    AccessTokenService,
    SessionService,
    UserGuard,
  ],
  // @UseGuards(UserGuard)는 사용하는 모듈에서 인스턴스를 만들므로 의존성(AccessTokenService)도 내보낸다
  exports: [AccessTokenService, UserGuard],
})
export class AuthModule {}
