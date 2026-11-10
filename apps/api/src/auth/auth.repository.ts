import { Injectable } from "@nestjs/common";
import type { OAuthProviderName } from "../config/env.js";
import { type EmailTokenPurpose, Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { TokenHash } from "./lib/token.js";
import type { OAuthIdentity } from "./oauth.gateway.js";

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

  // 비밀번호로 로그인할 수 있는 계정만 준다. 소셜·패스키 전용 계정(비밀번호 없음)은 null
  async findPasswordLogin(
    email: string,
  ): Promise<{ userId: string; passwordHash: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordCredential: { select: { passwordHash: true } },
      },
    });
    if (!user?.passwordCredential) return null;
    return {
      userId: user.id,
      passwordHash: user.passwordCredential.passwordHash,
    };
  }

  // 이미 같은 이메일이 있으면 아무것도 만들지 않고 null(AC-03). 동시 가입의 승자는 부분 UNIQUE 인덱스가 정한다(AC-04).
  // ON CONFLICT … WHERE는 Prisma API로 표현되지 않아 SQL로 쓴다. 사용자·비밀번호·인증 토큰은 함께 생기거나 함께 안 생긴다
  createPasswordUser(data: {
    email: string;
    passwordHash: string;
    verifyTokenHash: TokenHash;
    verifyExpiresAt: Date;
  }): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const [user] = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO users (email) VALUES (${data.email})
        ON CONFLICT (email) WHERE email IS NOT NULL DO NOTHING
        RETURNING id`;
      if (!user) return null;
      await tx.passwordCredential.create({
        data: { userId: user.id, passwordHash: data.passwordHash },
        select: { userId: true },
      });
      await tx.emailToken.create({
        data: {
          userId: user.id,
          purpose: "verify_email",
          tokenHash: data.verifyTokenHash,
          expiresAt: data.verifyExpiresAt,
        },
        select: { id: true },
      });
      return user.id;
    });
  }

  findUserByEmail(
    email: string,
  ): Promise<{ id: string; emailVerifiedAt: Date | null } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true },
    });
  }

  findMe(id: string): Promise<{
    id: string;
    email: string | null;
    emailVerifiedAt: Date | null;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
  }

  async insertEmailToken(data: {
    userId: string;
    purpose: EmailTokenPurpose;
    tokenHash: TokenHash;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.emailToken.create({ data, select: { id: true } });
  }

  // AC-05. 토큰 사용 표시와 인증 기록을 함께. 조건부 UPDATE라 같은 토큰을 동시에 써도 한 번만 성공한다
  verifyEmail(tokenHash: TokenHash, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const userId = await consumeEmailToken(
        tx,
        tokenHash,
        "verify_email",
        now,
      );
      if (!userId) return false;
      await tx.user.updateMany({
        where: { id: userId, emailVerifiedAt: null },
        data: { emailVerifiedAt: now },
      });
      return true;
    });
  }

  // AC-15. 토큰 사용, 비밀번호 교체, 이메일 인증 기록, 모든 Refresh Token 폐기를 한 번에
  resetPassword(
    tokenHash: TokenHash,
    passwordHash: string,
    now: Date,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const userId = await consumeEmailToken(
        tx,
        tokenHash,
        "reset_password",
        now,
      );
      if (!userId) return false;
      // 비밀번호가 없던 계정(이후 소셜 전용)도 메일 소유를 증명했으므로 비밀번호를 만든다
      await tx.passwordCredential.upsert({
        where: { userId },
        create: { userId, passwordHash },
        update: { passwordHash },
        select: { userId: true },
      });
      await tx.user.updateMany({
        where: { id: userId, emailVerifiedAt: null },
        data: { emailVerifiedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return true;
    });
  }

  // FEAT-004 AC-06~10. 제공자 계정으로 로그인할 사용자를 정한다(찾기 → 이메일로 연결 → 새로 만들기, 한 트랜잭션).
  // 동시 콜백이면 (provider, subject)·email UNIQUE에서 진 쪽이 롤백되고, 한 번 더 시도하면 이긴 쪽 연결을 찾는다
  async resolveOAuthUser(
    provider: OAuthProviderName,
    identity: OAuthIdentity,
    now: Date,
  ): Promise<string> {
    try {
      return await this.prisma.$transaction((tx) =>
        resolveOAuthUserInTx(tx, provider, identity, now),
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return this.prisma.$transaction((tx) =>
        resolveOAuthUserInTx(tx, provider, identity, now),
      );
    }
  }

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

  // 만료 행 정리(Q-7). 한 번에 batchSize개까지만 지워 긴 잠금을 피한다. Prisma deleteMany는 개수 제한이 없어 SQL로 쓴다.
  // 같은 묶음의 토큰은 만료 시각이 같아 묶음 단위로 함께 지워진다(재사용 감지는 만료 전 묶음에만 필요)
  async deleteExpiredRefreshTokens(
    before: Date,
    batchSize: number,
  ): Promise<number> {
    return this.prisma.$executeRaw`
      DELETE FROM refresh_tokens WHERE id IN (
        SELECT id FROM refresh_tokens WHERE expires_at < ${before} LIMIT ${batchSize}
      )`;
  }

  async deleteExpiredEmailTokens(
    before: Date,
    batchSize: number,
  ): Promise<number> {
    return this.prisma.$executeRaw`
      DELETE FROM email_tokens WHERE id IN (
        SELECT id FROM email_tokens WHERE expires_at < ${before} LIMIT ${batchSize}
      )`;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}

// 사용 전·만료 전·같은 목적의 토큰만 사용 처리하고 그 사용자 ID를 준다
async function consumeEmailToken(
  tx: Prisma.TransactionClient,
  tokenHash: TokenHash,
  purpose: EmailTokenPurpose,
  now: Date,
): Promise<string | null> {
  const [token] = await tx.emailToken.updateManyAndReturn({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
    select: { userId: true },
  });
  return token?.userId ?? null;
}

// identity.email은 정규화된 값이어야 한다(호출한 쪽이 normalizeEmail 적용). 인증된 이메일일 때만 넘어온다고 가정하지 않는다
async function resolveOAuthUserInTx(
  tx: Prisma.TransactionClient,
  provider: OAuthProviderName,
  identity: OAuthIdentity,
  now: Date,
): Promise<string> {
  const linked = await tx.oAuthAccount.findUnique({
    where: { provider_subject: { provider, subject: identity.subject } },
    select: { userId: true },
  });
  if (linked) return linked.userId; // AC-06

  let userId: string;
  if (identity.email && identity.emailVerified) {
    const existing = await tx.user.findUnique({
      where: { email: identity.email },
      select: { id: true, emailVerifiedAt: true },
    });
    if (existing) {
      userId = existing.id; // AC-07
      if (!existing.emailVerifiedAt) {
        // AC-08: 남의 이메일로 미리 가입했을 수 있다. 그 사람이 정한 비밀번호·세션을 무효화한다
        await tx.passwordCredential.deleteMany({ where: { userId } });
        await tx.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.user.update({
          where: { id: userId },
          data: { emailVerifiedAt: now },
          select: { id: true },
        });
      }
    } else {
      userId = (
        await tx.user.create({
          data: { email: identity.email, emailVerifiedAt: now },
          select: { id: true },
        })
      ).id; // AC-09
    }
  } else {
    // AC-09: 인증되지 않은 이메일은 저장하지 않는다(다른 계정의 이메일을 선점하지 못하게)
    userId = (await tx.user.create({ data: {}, select: { id: true } })).id;
  }

  await tx.oAuthAccount.create({
    data: { userId, provider, subject: identity.subject },
    select: { id: true },
  });
  return userId;
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
