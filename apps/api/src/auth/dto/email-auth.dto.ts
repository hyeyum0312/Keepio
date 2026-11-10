import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class EmailDto {
  @ApiProperty({ example: "user@example.com" })
  @IsString()
  email!: string;
}
