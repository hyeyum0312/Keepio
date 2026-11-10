import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

// 메일 링크의 토큰. 형식 오류도 INVALID_TOKEN으로 답한다
export class TokenDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
