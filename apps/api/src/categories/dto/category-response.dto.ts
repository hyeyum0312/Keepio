import { ApiProperty } from "@nestjs/swagger";
import { ApiErrorResponse } from "../../common/api-error.js";

export class CategoryResponse {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ maxLength: 20, example: "여행" })
  name!: string;

  @ApiProperty({
    description: "이 카테고리의 활성 링크 수(휴지통은 세지 않는다)",
  })
  bookmarkCount!: number;
}

export class CategoryListResponse {
  @ApiProperty({ type: [CategoryResponse], description: "이름순(ko)" })
  items!: CategoryResponse[];
}

// 409 CATEGORY_DUPLICATE: 이미 있는 카테고리 ID. 화면은 오류로 보여 주지 않고 이 카테고리를 쓴다(AC-02·13)
export class CategoryConflictErrorResponse extends ApiErrorResponse {
  @ApiProperty({ format: "uuid" })
  categoryId!: string;
}
