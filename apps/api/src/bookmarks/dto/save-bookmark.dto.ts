import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsOptional, IsString } from "class-validator";

// 형식·길이는 도메인 오류(INVALID_URL 등)로 거부한다. 여기서 막으면 사용자 문구가 공통 문구가 된다(ADR-009)
export class SaveBookmarkDto {
  @ApiProperty({ example: "https://example.com/article?id=1" })
  @IsString()
  url!: string;

  // FEAT-010 AC-01. 1~100자(공백 정리 후). 비우면 없음
  @ApiPropertyOptional({ example: "랜딩 모션 레퍼런스", maxLength: 100 })
  @IsOptional()
  @IsString()
  title?: string;

  // FEAT-010 AC-01·02. 각 1~30자, 같은 이름은 하나로, 최대 10개. 개수 오류는 BOOKMARK_TAG_LIMIT
  @ApiPropertyOptional({ type: [String], example: ["모션", "랜딩"] })
  @IsOptional()
  @IsArray()
  // 요청 크기 상한(사용자 문구 대상이 아닌 비정상 입력)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  tags?: string[];
}
