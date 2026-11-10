// 로그용. 첫 글자와 도메인만 남긴다(BACKEND.md 개인정보 로그 금지). auth·mail이 함께 쓴다
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}
