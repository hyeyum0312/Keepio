import type { MailMessage } from "../mail/mail.sender.js";

// FEAT-003 메일 본문. 텍스트만 쓴다. 링크의 토큰은 웹 화면이 읽은 즉시 주소에서 지운다(Feature 문서 보안 항목)
export const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_PASSWORD_TTL_MS = 30 * 60 * 1000;

export function verifyEmailMail(
  to: string,
  webOrigin: string,
  token: string,
): MailMessage {
  return {
    to,
    subject: "[keepio] 이메일 주소를 인증해 주세요",
    text: [
      "keepio 가입을 환영해요.",
      "아래 링크를 눌러 이메일 주소를 인증해 주세요. 링크는 24시간 동안 쓸 수 있어요.",
      "",
      link(webOrigin, "/verify-email", token),
      "",
      "가입한 적이 없다면 이 메일은 무시해 주세요.",
    ].join("\n"),
  };
}

// AC-03: 이미 가입된 주소로 다시 가입을 시도했을 때. 응답은 같고 안내는 메일로만 한다
export function alreadyRegisteredMail(
  to: string,
  webOrigin: string,
): MailMessage {
  return {
    to,
    subject: "[keepio] 이미 가입된 이메일이에요",
    text: [
      "이 이메일 주소로 keepio 가입 요청이 있었지만, 이미 가입된 주소예요.",
      "비밀번호가 기억나지 않으면 아래에서 재설정할 수 있어요.",
      "",
      `${webOrigin}/forgot-password`,
      "",
      "직접 요청하지 않았다면 이 메일은 무시해 주세요.",
    ].join("\n"),
  };
}

export function resetPasswordMail(
  to: string,
  webOrigin: string,
  token: string,
): MailMessage {
  return {
    to,
    subject: "[keepio] 비밀번호 재설정 안내",
    text: [
      "아래 링크에서 새 비밀번호를 정해 주세요. 링크는 30분 동안 한 번만 쓸 수 있어요.",
      "",
      link(webOrigin, "/reset-password", token),
      "",
      "직접 요청하지 않았다면 이 메일은 무시해 주세요. 비밀번호는 바뀌지 않아요.",
    ].join("\n"),
  };
}

function link(webOrigin: string, path: string, token: string) {
  const url = new URL(path, webOrigin);
  url.searchParams.set("token", token);
  return url.href;
}
