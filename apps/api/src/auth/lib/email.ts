// 이메일 정규화(FEAT-003 AC-02). DB CHECK(users_email_normalized_check)와 같은 규칙.
// 실제 소유 확인은 인증 메일이 하므로 형식 검사는 명백한 오류만 거른다(RFC 전체 문법을 따르지 않는다).

// RFC 5321 경로 길이 한계
export const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export type NormalizeEmailResult = { ok: true; email: string } | { ok: false };

// 로컬 파트까지 소문자로 바꾼다. 대소문자를 구분하는 메일 서버는 사실상 없고, 구분하면 같은 사람이 계정을 둘 만들 수 있다
export function normalizeEmail(input: string): NormalizeEmailResult {
  const email = input.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(email)) {
    return { ok: false };
  }
  if (email.indexOf("@") > MAX_LOCAL_PART_LENGTH) return { ok: false };
  return { ok: true, email };
}
