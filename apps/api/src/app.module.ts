import { Module } from "@nestjs/common";
import { BookmarksModule } from "./bookmarks/bookmarks.module.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [PrismaModule, HealthModule, BookmarksModule],
})
export class AppModule {}
