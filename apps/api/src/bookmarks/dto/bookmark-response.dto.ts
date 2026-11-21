import { ApiProperty } from "@nestjs/swagger";
import { ApiErrorResponse } from "../../common/api-error.js";

export class BookmarkTagResponse {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  name!: string;
}

const THUMBNAIL_STATUSES = ["pending", "ready", "failed"] as const;

export class BookmarkThumbnailResponse {
  @ApiProperty({
    enum: THUMBNAIL_STATUSES,
    description:
      "pending: 가져오는 중, ready: 있음, failed: 없음(직접 올리기 가능)",
  })
  status!: (typeof THUMBNAIL_STATUSES)[number];

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      "API 기준 경로(서명, 10~20분 유효). API 주소를 앞에 붙여 <img>에 쓴다",
  })
  url!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      "링크 페이지의 og:image 원본 주소(자동 수집, 직접 올렸으면 null). url을 못 쓰면(만료·파일 없음) 이 주소로 바로 불러온다",
  })
  sourceUrl!: string | null;
}

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

  @ApiProperty({
    type: String,
    nullable: true,
    description: "저장할 때 넣은 제목",
  })
  title!: string | null;

  @ApiProperty({
    description: "보여 줄 제목: 넣은 제목 → 페이지 제목(og:title) → 도메인",
  })
  displayTitle!: string;

  @ApiProperty({ type: [BookmarkTagResponse], description: "이름순" })
  tags!: BookmarkTagResponse[];

  @ApiProperty({ type: BookmarkThumbnailResponse })
  thumbnail!: BookmarkThumbnailResponse;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      "링크 페이지가 알려 준 사이트 아이콘 주소(apple-touch-icon → icon). 없으면 null이고 화면은 사이트 주소/favicon.ico를 불러 본다. 보여 줄 썸네일이 없을 때 아트워크 위에 올린다",
  })
  faviconUrl!: string | null;
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
