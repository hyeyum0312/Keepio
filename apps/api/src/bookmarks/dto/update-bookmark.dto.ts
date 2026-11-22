import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";

// FEAT-011 AC-01·02(제목)와 FEAT-008 AC-09(카테고리 이동). 보낸 항목만 고친다.
// 제목은 null·빈 문자열·공백뿐이면 사용자 제목을 지운다(표시 제목은 페이지 제목 → 사이트 이름).
// 길이(100자)는 서비스가 공백 정리 뒤에 판단해 도메인 문구로 거부한다(ADR-009)
export class UpdateBookmarkDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 100,
    example: "다이어리 데이 체크 다이어리",
    description: "비우거나 null이면 사용자 제목을 지운다. 보내지 않으면 그대로",
  })
  @IsOptional()
  @ValidateIf((o: UpdateBookmarkDto) => o.title !== null)
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description:
      "링크의 카테고리(FEAT-008). null이면 미분류. 보내지 않으면 그대로",
  })
  @IsOptional()
  @ValidateIf((o: UpdateBookmarkDto) => o.categoryId !== null)
  @IsUUID()
  categoryId?: string | null;
}
