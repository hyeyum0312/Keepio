import { ApiProperty } from "@nestjs/swagger";
import { ApiErrorResponse } from "../../common/api-error.js";

export class BookmarkResponse {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ description: "사용자가 저장한 원래 URL" })
  url!: string;

  @ApiProperty()
  normalizedUrl!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

// 409 BOOKMARK_DELETED: 복구 안내에 쓸 ID를 함께 준다(D-01)
export class BookmarkDeletedErrorResponse extends ApiErrorResponse {
  @ApiProperty({ format: "uuid" })
  bookmarkId!: string;
}
