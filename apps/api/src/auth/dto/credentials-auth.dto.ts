import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

// 형식·길이는 도메인 오류(INVALID_EMAIL·WEAK_PASSWORD)로 거부한다. 여기서 막으면 사용자 문구가 공통 문구가 된다(ADR-009)
export class CredentialsDto {
  @ApiProperty({ example: "user@example.com" })
  @IsString()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  password!: string;
}
