import { Module } from "@nestjs/common";
import { Resend } from "resend";
import { loadEnv } from "../config/env.js";
import { ConsoleMailSender } from "./console-mail.sender.js";
import { MailDispatcher } from "./mail.dispatcher.js";
import { MailSender } from "./mail.sender.js";
import { MemoryMailSender } from "./memory-mail.sender.js";
import { ResendMailSender } from "./resend-mail.sender.js";

// 운영은 Resend, 개발은 콘솔 출력, 테스트는 메모리 기록(FEAT-003 결정).
// 운영 필수 값(RESEND_API_KEY·MAIL_FROM)은 loadEnv가 시작 시 검증한다
export function createMailSender(): MailSender {
  const env = loadEnv();
  if (env.nodeEnv === "production") {
    return new ResendMailSender(new Resend(env.resendApiKey), env.mailFrom!);
  }
  if (env.nodeEnv === "development") return new ConsoleMailSender();
  return new MemoryMailSender();
}

@Module({
  providers: [
    { provide: MailSender, useFactory: createMailSender },
    MailDispatcher,
  ],
  // 기능 코드는 MailDispatcher로만 보낸다(요청이 발송을 기다리지 않게). MailSender는 테스트 교체용
  exports: [MailDispatcher, MailSender],
})
export class MailModule {}
