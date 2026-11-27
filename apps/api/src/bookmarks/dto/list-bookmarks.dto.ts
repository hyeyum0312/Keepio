import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export const BOOKMARK_STATUSES = ["active", "deleted"] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// 잘못된 값은 클라이언트 버그라 공통 VALIDATION_FAILED(FEAT-002 데이터 계약)
export class ListBookmarksQuery {
  @ApiPropertyOptional({ enum: BOOKMARK_STATUSES, default: "active" })
  @IsOptional()
  @IsIn(BOOKMARK_STATUSES)
  status: (typeof BOOKMARK_STATUSES)[number] = "active";

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: "이전 응답의 nextCursor 그대로" })
  @IsOptional()
  @IsString()
  cursor?: string;

  // FEAT-008 AC-11. 본인 카테고리가 아니면 빈 목록이다(목록은 늘 user_id로 거른다)
  @ApiPropertyOptional({ format: "uuid", description: "이 카테고리의 링크만" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      "true면 미분류(카테고리 없음) 링크만. categoryId와 함께 줄 수 없다",
  })
  @IsOptional()
  // 쿼리 문자열 "true"/"false"만 불리언으로 바꾼다. 다른 값은 그대로 두어 IsBoolean이 거부한다
  @Transform(({ value }: { value: unknown }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  uncategorized?: boolean;
}
