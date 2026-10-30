import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

// 형식·길이는 도메인 오류(INVALID_URL 등)로 거부한다. 여기서 막으면 사용자 문구가 공통 문구가 된다(ADR-009)
export class SaveBookmarkDto {
  @ApiProperty({ example: "https://example.com/article?id=1" })
  @IsString()
  url!: string;
}
