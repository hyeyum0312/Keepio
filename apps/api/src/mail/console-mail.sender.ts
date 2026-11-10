import { Logger } from "@nestjs/common";
import { maskEmail } from "../common/mask-email.js";
import { type MailMessage, MailSender } from "./mail.sender.js";

const logger = new Logger("Mail");

// 개발 전용(FEAT-003 결정): 실제로 보내지 않고 본문(인증·재설정 링크 포함)을 콘솔에 출력한다.
// 본문에 토큰이 있으므로 운영에서는 절대 쓰지 않는다(MailModule이 development에서만 고른다)
export class ConsoleMailSender extends MailSender {
  send({ to, subject, text }: MailMessage): Promise<void> {
    logger.log(`to=${maskEmail(to)} subject=${subject}\n${text}`);
    return Promise.resolve();
  }
}
