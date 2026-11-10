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

// FEAT-004 AC-05: 버튼 표시의 권위(키가 설정된 제공자만)
export class OAuthProvidersResponse {
  @ApiProperty({ enum: ["google", "kakao"], isArray: true })
  providers!: ("google" | "kakao")[];
}
