import { Module } from "@nestjs/common";
import { AuthRepository } from "./auth.repository.js";
import { UserGuard } from "./user.guard.js";

// @UseGuards(UserGuard)는 사용하는 모듈에서 인스턴스를 만들므로 의존성(AuthRepository)도 내보낸다
@Module({
  providers: [AuthRepository, UserGuard],
  exports: [AuthRepository, UserGuard],
})
export class AuthModule {}
