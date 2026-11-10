import type { Resend } from "resend";
import { type MailMessage, MailSender } from "./mail.sender.js";

// 외부 호출 상한(AGENTS: 서버 작업은 timeout을 둔다). 넘으면 요청을 취소한다
export const SEND_TIMEOUT_MS = 5_000;

export class ResendMailSender extends MailSender {
  constructor(
    private readonly client: Pick<Resend, "emails">,
    private readonly from: string,
  ) {
    super();
  }

  async send({ to, subject, text }: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send(
      { from: this.from, to, subject, text },
      { signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
    );
    // SDK는 실패를 예외 대신 값으로 준다. 메시지에 수신 주소·본문(토큰 포함)을 넣지 않는다
    if (error) throw new Error(`Resend send failed: ${error.name}`);
  }
}
