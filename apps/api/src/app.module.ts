import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module.js";
import { BookmarksModule } from "./bookmarks/bookmarks.module.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    // 정기 작업(FEAT-003 만료 토큰 정리)
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    BookmarksModule,
  ],
})
export class AppModule {}
