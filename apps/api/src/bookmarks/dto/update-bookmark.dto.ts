import { ApiProperty } from "@nestjs/swagger";
import { IsString, ValidateIf } from "class-validator";

// FEAT-011 AC-01·02. 제목만 고친다. null·빈 문자열·공백뿐이면 사용자 제목을 지운다(표시 제목은 페이지 제목 → 사이트 이름).
// 길이(100자)는 서비스가 공백 정리 뒤에 판단해 도메인 문구로 거부한다(ADR-009)
export class UpdateBookmarkDto {
  @ApiProperty({
    type: String,
    nullable: true,
    maxLength: 100,
    example: "다이어리 데이 체크 다이어리",
    description: "비우거나 null이면 사용자 제목을 지운다",
  })
  @ValidateIf((o: UpdateBookmarkDto) => o.title !== null)
  @IsString()
  title!: string | null;
}
