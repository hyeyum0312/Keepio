import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AuthRepository } from "./auth.repository.js";

// FEAT-003 Q-7. 만료 후 하루가 지난 Refresh·메일 토큰을 지운다(DB 행이 계속 쌓이는 비용 방지)
export const CLEANUP_GRACE_MS = 24 * 60 * 60 * 1000;
export const CLEANUP_BATCH_SIZE = 1000;

const logger = new Logger("AuthCleanup");

@Injectable()
export class AuthCleanupTask {
  constructor(private readonly repo: AuthRepository) {}

  // 매일 03:00 KST. 여러 인스턴스가 동시에 돌아도 삭제라 결과는 같다
  @Cron("0 18 * * *", { name: "auth-token-cleanup", timeZone: "UTC" })
  async runScheduled(): Promise<void> {
    try {
      const deleted = await this.cleanup(new Date());
      logger.log(
        `deleted refresh=${deleted.refreshTokens} email=${deleted.emailTokens}`,
      );
    } catch (error) {
      // 다음 실행에서 다시 지우므로 실패는 기록만 한다(처리되지 않은 Promise 거부로 프로세스를 흔들지 않는다)
      logger.error(
        "auth token cleanup failed",
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // 기준 시각이 고정이라 반복은 반드시 끝난다(새로 만료되는 행은 다음 실행 몫)
  async cleanup(
    now: Date,
    batchSize = CLEANUP_BATCH_SIZE,
  ): Promise<{ refreshTokens: number; emailTokens: number }> {
    const before = new Date(now.getTime() - CLEANUP_GRACE_MS);
    return {
      refreshTokens: await drain((n) =>
        this.repo.deleteExpiredRefreshTokens(before, n),
      ),
      emailTokens: await drain((n) =>
        this.repo.deleteExpiredEmailTokens(before, n),
      ),
    };

    async function drain(deleteBatch: (n: number) => Promise<number>) {
      let total = 0;
      for (;;) {
        const deleted = await deleteBatch(batchSize);
        total += deleted;
        if (deleted < batchSize) return total;
      }
    }
  }
}
