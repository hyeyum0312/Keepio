import { type MailMessage, MailSender } from "./mail.sender.js";

// 테스트 전용. 보낸 메일을 기록해 링크의 토큰을 꺼내 쓴다
export class MemoryMailSender extends MailSender {
  readonly sent: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  to(address: string): MailMessage[] {
    return this.sent.filter((m) => m.to === address);
  }

  clear() {
    this.sent.length = 0;
  }
}
