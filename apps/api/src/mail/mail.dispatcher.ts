import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common";
import { maskEmail } from "../common/mask-email.js";
import { type MailMessage, MailSender } from "./mail.sender.js";

// 메모리 큐(단일 인스턴스 전제). 프로세스가 비정상 종료되면 대기 중인 메일은 사라진다 — 사용자는 재발송할 수 있다.
// 유실 없는 발송·재시도가 필요해지면 Outbox(spec 03 비동기 처리)로 옮긴다
export const MAX_CONCURRENT_SENDS = 4;
export const MAX_QUEUED_MAILS = 1000;
export const SHUTDOWN_DRAIN_TIMEOUT_MS = 10_000;

const logger = new Logger("Mail");

// 요청은 발송을 기다리지 않는다. 응답 시간이 메일 발송 여부에 따라 달라지면 가입 여부가 드러난다(FEAT-003 AC-03·AC-14)
@Injectable()
export class MailDispatcher implements OnApplicationShutdown {
  private readonly queue: MailMessage[] = [];
  private active = 0;
  private idleWaiters: (() => void)[] = [];

  constructor(private readonly sender: MailSender) {}

  enqueue(message: MailMessage): void {
    if (this.queue.length >= MAX_QUEUED_MAILS) {
      logger.error(`mail queue full; dropped to=${maskEmail(message.to)}`);
      return;
    }
    this.queue.push(message);
    this.pump();
  }

  // 대기·발송 중인 메일이 모두 끝나면 이행한다(종료 처리와 테스트에서 쓴다)
  drain(): Promise<void> {
    if (this.isIdle()) return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  async onApplicationShutdown(): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), SHUTDOWN_DRAIN_TIMEOUT_MS);
    });
    const result = await Promise.race([this.drain(), timeout]);
    clearTimeout(timer);
    if (result === "timeout") {
      logger.error(
        `shutdown before mail drained; pending=${this.queue.length + this.active}`,
      );
    }
  }

  private pump() {
    while (this.active < MAX_CONCURRENT_SENDS && this.queue.length > 0) {
      const message = this.queue.shift()!;
      this.active++;
      void this.sender
        .send(message)
        .catch((error: unknown) => {
          logger.error(
            `mail send failed: to=${maskEmail(message.to)} subject=${message.subject}`,
            error instanceof Error ? error.stack : undefined,
          );
        })
        .finally(() => {
          this.active--;
          this.pump();
          if (this.isIdle()) this.notifyIdle();
        });
    }
  }

  private isIdle() {
    return this.active === 0 && this.queue.length === 0;
  }

  private notifyIdle() {
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    for (const resolve of waiters) resolve();
  }
}
