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

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  deletedAt!: string | null;
}

export class BookmarkListResponse {
  @ApiProperty({ type: [BookmarkResponse] })
  items!: BookmarkResponse[];

  @ApiProperty({
    type: String,
    nullable: true,
    description: "다음 페이지 요청에 그대로 넘긴다. 없으면 null",
  })
  nextCursor!: string | null;
}

// 409 BOOKMARK_DELETED(저장 시 삭제된 링크, D-01)·BOOKMARK_ALREADY_SAVED(복구 시 같은 링크가 활성, FEAT-002): 관련 북마크 ID
export class BookmarkConflictErrorResponse extends ApiErrorResponse {
  @ApiProperty({ format: "uuid" })
  bookmarkId!: string;
}
