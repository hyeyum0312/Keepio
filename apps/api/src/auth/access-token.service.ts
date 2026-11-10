import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

// FEAT-003 Q-3. 서명만 검증하므로(요청당 DB 조회 없음) 로그아웃 후에도 이 시간까지 유효하다(수용한 트레이드오프)
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const JWT_ALGORITHM = "HS256";
export const JWT_ISSUER = "keepio-api";
export const JWT_AUDIENCE = "keepio";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AccessTokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  // 서명·알고리즘·iss·aud·exp 중 하나라도 맞지 않으면 null(이유는 구분하지 않는다)
  async verify(token: string): Promise<string | null> {
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub?: unknown }>(token);
      return typeof sub === "string" && UUID.test(sub) ? sub : null;
    } catch {
      return null;
    }
  }
}
