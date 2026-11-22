import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CategoriesController } from "./categories.controller.js";
import { CategoriesRepository } from "./categories.repository.js";
import { CategoriesService } from "./categories.service.js";

@Module({
  imports: [AuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  // 링크에 카테고리를 걸 때 소유 확인에 쓴다(BookmarksModule)
  exports: [CategoriesService],
})
export class CategoriesModule {}
