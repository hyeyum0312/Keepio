import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

// 길이(1~20자)는 서비스가 공백 정리 뒤에 판단해 도메인 문구로 거부한다(ADR-009)
export class CreateCategoryDto {
  @ApiProperty({ maxLength: 20, example: "여행" })
  @IsString()
  name!: string;
}
