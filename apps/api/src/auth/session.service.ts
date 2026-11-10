import { randomUUID } from "node:crypto";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AccessTokenService,
} from "./access-token.service.js";
import { AuthRepository } from "./auth.repository.js";
import {
  generateToken,
  hashToken,
  isWellFormedToken,
  type TokenHash,
} from "./lib/token.js";

// FEAT-003 Q-3
export const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const ROTATION_GRACE_MS = 10_000;

export type Session = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
};

const logger = new Logger("Session");

// 로그인 수단(비밀번호·소셜·패스키)과 무관한 세션 발급·회전·폐기(ADR-011). 수단은 사용자를 확인한 뒤 issue만 부른다
@Injectable()
export class SessionService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async issue(userId: string): Promise<Session> {
    const refreshToken = generateToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.repo.insertRefreshToken({
      userId,
      familyId: randomUUID(),
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });
    return this.toSession(userId, refreshToken, expiresAt);
  }

  // AC-10~12. 실패 이유(없음·만료·폐기·경합·재사용)는 응답에서 구분하지 않는다
  async rotate(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken || !isWellFormedToken(refreshToken)) {
      throw sessionExpired();
    }
    const now = new Date();
    const oldHash = hashToken(refreshToken);
    const next = generateToken();
    const rotated = await this.repo.rotateRefreshToken(
      oldHash,
      hashToken(next),
      now,
    );
    if (rotated) return this.toSession(rotated.userId, next, rotated.expiresAt);

    await this.revokeIfReused(oldHash, now);
    throw sessionExpired();
  }

  // AC-13 로그아웃. 토큰이 없거나 이미 폐기됐어도 성공(멱등)
  async revoke(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken || !isWellFormedToken(refreshToken)) return;
    const token = await this.repo.findRefreshToken(hashToken(refreshToken));
    if (token && !token.revokedAt) {
      await this.repo.revokeFamily(token.familyId, new Date());
    }
  }

  // 회전된 지 유예 시간이 지난 토큰이 다시 오면 탈취로 보고 묶음 전체를 폐기한다(AC-11).
  // 유예 시간 안이면 여러 탭의 동시 갱신 경합이므로 폐기하지 않는다(AC-12)
  private async revokeIfReused(tokenHash: TokenHash, now: Date) {
    const token = await this.repo.findRefreshToken(tokenHash);
    if (!token?.usedAt || token.revokedAt) return;
    if (now.getTime() - token.usedAt.getTime() <= ROTATION_GRACE_MS) return;
    await this.repo.revokeFamily(token.familyId, now);
    logger.warn(`refresh token reuse detected; family=${token.familyId}`);
  }

  private async toSession(
    userId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<Session> {
    return {
      accessToken: await this.accessTokens.sign(userId),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      refreshExpiresAt,
    };
  }
}

function sessionExpired() {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    "SESSION_EXPIRED",
    "다시 로그인해 주세요.",
  );
}
