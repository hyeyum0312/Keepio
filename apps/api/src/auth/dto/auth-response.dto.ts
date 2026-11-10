import { ApiProperty } from "@nestjs/swagger";

// Refresh Token은 body에 넣지 않는다(HttpOnly 쿠키로만)
export class AccessTokenResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ description: "Access Token 만료까지 초" })
  expiresIn!: number;
}

export class MeResponse {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  email!: string | null;

  @ApiProperty()
  emailVerified!: boolean;
}
