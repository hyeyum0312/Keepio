export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

// 발송 수단을 환경별로 바꿔 끼우기 위한 DI 토큰(운영 Resend, 개발 콘솔, 테스트 메모리).
// 실패하면 예외를 던진다. 호출한 쪽이 로그를 남기고 사용자 응답은 바꾸지 않는다(FEAT-003)
export abstract class MailSender {
  abstract send(message: MailMessage): Promise<void>;
}
