import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

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
}
