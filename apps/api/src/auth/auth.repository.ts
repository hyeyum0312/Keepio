import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { TokenHash } from "./lib/token.js";

export type RefreshTokenState = {
  familyId: string;
  usedAt: Date | null;
  revokedAt: Date | null;
};

export type RotatedRefreshToken = {
  userId: string;
  familyId: string;
  expiresAt: Date;
};

// 시각은 모두 앱이 넘긴 now로 쓰고 비교한다(시계 하나). 트랜잭션은 이 클래스 메서드 안에서만 연다(BACKEND.md)
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insertRefreshToken(data: {
    userId: string;
    familyId: string;
    tokenHash: TokenHash;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({ data, select: { id: true } });
  }

  // 동시 요청의 승자는 조건부 UPDATE가 정한다: 같은 행을 두 번째로 갱신하려는 문장은 첫 커밋을 기다린 뒤
  // 조건(used_at IS NULL)을 다시 평가해 0행이 된다(FEAT-003 AC-12). 표시와 새 토큰 저장은 함께 성공하거나 함께 실패한다
  rotateRefreshToken(
    oldHash: TokenHash,
    newHash: TokenHash,
    now: Date,
  ): Promise<RotatedRefreshToken | null> {
    return this.prisma.$transaction(async (tx) => {
      const [used] = await tx.refreshToken.updateManyAndReturn({
        where: {
          tokenHash: oldHash,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
        select: { userId: true, familyId: true, expiresAt: true },
      });
      if (!used) return null;
      // 만료 시각은 첫 로그인 기준 그대로 물려준다(Q-3 절대 만료)
      await tx.refreshToken.create({
        data: { ...used, tokenHash: newHash },
        select: { id: true },
      });
      return used;
    });
  }

  findRefreshToken(tokenHash: TokenHash): Promise<RefreshTokenState | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true, usedAt: true, revokedAt: true },
    });
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
