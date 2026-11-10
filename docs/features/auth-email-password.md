# FEAT-003 — 이메일/비밀번호 인증과 세션(토큰 회전)

- Status: Approved
- Updated: 2026-11-10 (결정 사항 Q-1~Q-7·메일 서비스 확정)
- Related: PRD(01) MVP 범위 "계정 인증과 사용자 데이터 격리", spec 03 기술 스택(인증)·Auth 모듈·인증 및 보안, DB/API(04) users, spec 05 Phase 1 "인증/인가, 사용자별 격리", BACKEND standards Security·Controllers, QUALITY Must-cover 6(교차 사용자 접근 거부), ADR-011, OPEN-QUESTIONS D-04·D-11·D-12

## 목적 및 비범위

- 사용자 문제: 내 링크는 나만 볼 수 있어야 하고, 한 번 로그인하면 기기에서 계속 로그인 상태가 유지되어야 한다. 비밀번호를 잊어도 계정을 되찾을 수 있어야 한다.
- 이 기능은 이후 소셜 로그인(FEAT-004 예정)과 패스키(FEAT-005 예정)가 함께 쓰는 **세션 기반**(토큰 발급·회전·폐기, 현재 사용자 Guard)을 만든다. 로그인 수단만 다르고 로그인 이후 과정은 같다.
- 이번 작업에서 하지 않는 것: 소셜 로그인·계정 연결(FEAT-004), 패스키(FEAT-005), 모바일 앱 토큰 저장(D-04 PoC), 로그인 상태에서 비밀번호 변경, 이메일 변경, 회원 탈퇴, "모든 기기에서 로그아웃", 유출 비밀번호 목록 대조(Q-5), 웹 화면과 프론트 토큰 처리(Q-6, 별도 작업으로 바로 이어서 진행).

## 사용자 흐름 및 수용 기준

가입·인증

- [ ] AC-01 가입: 형식이 올바른 이메일과 정책을 만족하는 비밀번호로 가입하면 계정과 비밀번호 해시(argon2id)가 저장되고 인증 메일이 발송되며 `202`를 반환한다. 비밀번호 원문은 DB·로그 어디에도 남지 않는다.
- [ ] AC-02 가입 입력 거부: 이메일 형식 오류는 `400 INVALID_EMAIL`, 비밀번호가 8자 미만이거나 128자 초과면 `400 WEAK_PASSWORD`로 거부하고 아무것도 저장하지 않는다. 이메일은 앞뒤 공백 제거·소문자로 정규화해 저장·비교한다.
- [ ] AC-03 이미 가입된 이메일: 응답은 AC-01과 같은 `202`이고(가입 여부 노출 방지), 계정을 새로 만들지 않으며, 해당 주소로 "이미 가입된 계정" 안내 메일을 보낸다. (Q-1)
- [ ] AC-04 동시 가입: 같은 이메일로 가입 요청 10개를 동시에 보내도 계정은 1개다(DB UNIQUE가 최종 권위).
- [ ] AC-05 이메일 인증: 메일의 토큰으로 인증하면 `email_verified_at`이 기록되고 `204`. 만료(24시간)·사용된·존재하지 않는 토큰은 `400 INVALID_TOKEN`. 토큰은 한 번만 쓸 수 있고 DB에는 해시만 저장한다.
- [ ] AC-06 미인증 계정: 이메일 미인증 상태에서도 로그인과 기존 기능 사용은 가능하다. 인증 여부는 `GET /api/me`의 `emailVerified`로 내려준다. (Q-2)

로그인·세션

- [ ] AC-07 로그인: 올바른 이메일·비밀번호면 `200 { accessToken, expiresIn }`과 Refresh Token 쿠키(`HttpOnly; Secure; SameSite=Lax; Path=/api/auth`)를 준다. Access Token은 JWT(15분), Refresh Token은 무작위 256비트 값이며 DB에는 SHA-256 해시만 저장한다(14일). Refresh 만료는 첫 로그인 기준 절대 시각이며 회전해도 늘어나지 않는다. (Q-3)
- [ ] AC-08 로그인 실패: 없는 이메일과 틀린 비밀번호는 같은 `401 INVALID_CREDENTIALS`와 같은 문구를 준다. 없는 이메일에도 더미 해시 검증을 수행해 응답 시간으로 가입 여부를 구분할 수 없게 한다.
- [ ] AC-09 인증된 요청: 유효한 Access Token(`Authorization: Bearer`)이면 현재 사용자가 정해진다. 없음·서명 오류·만료면 `401 UNAUTHENTICATED`. 기존 컨트롤러는 변경 없이 `@CurrentUser()`로 사용자를 받는다.
- [ ] AC-10 토큰 회전: Refresh 요청이 성공하면 새 Access Token과 새 Refresh Token을 주고, 이전 Refresh Token은 사용됨으로 표시된다.
- [ ] AC-11 재사용 감지: 이미 사용된 Refresh Token이 회전 후 10초(유예 시간)가 지나 다시 제출되면 탈취로 보고 같은 로그인에서 이어진 토큰 묶음(family) 전체를 폐기하고 `401 SESSION_EXPIRED`를 준다. 이후 그 묶음의 최신 토큰도 거부된다.
- [ ] AC-12 동시 Refresh: 같은 Refresh Token으로 동시에 요청이 와도 회전은 정확히 1번 일어난다(조건부 UPDATE로 승자 결정). 유예 시간 안에 진 요청은 묶음을 폐기하지 않고 `401 SESSION_EXPIRED`만 받는다. 여러 탭이 동시에 갱신해도 로그아웃되지 않는다(쿠키는 승자의 응답으로 이미 갱신됨).
- [ ] AC-13 로그아웃: 현재 Refresh Token의 묶음을 폐기하고 쿠키를 지우며 `204`. 토큰이 없거나 이미 폐기됐어도 `204`(멱등).

비밀번호 재설정

- [ ] AC-14 재설정 요청: 가입 여부와 무관하게 항상 `202`. 가입된 주소면 재설정 메일(토큰 30분, 1회용)을 보낸다.
- [ ] AC-15 재설정 완료: 유효한 토큰과 정책을 만족하는 새 비밀번호면 비밀번호를 바꾸고, 해당 사용자의 모든 Refresh Token을 폐기하고, 이메일을 인증된 것으로 기록한다(메일을 받았다는 것이 소유 증명). `204`. 토큰 오류는 `400 INVALID_TOKEN`.

보호·격리

- [ ] AC-16 요청 제한: 로그인·가입·재설정 요청·인증 메일 재발송을 IP별·이메일별로 제한하고 초과하면 `429 TOO_MANY_ATTEMPTS`. 값: 로그인 IP당 분당 10회·이메일당 15분 5회, 메일 발송(가입·재발송·재설정) 이메일당 시간당 3회. (Q-4)
- [ ] AC-17 사용자 격리(Must-cover 6): 사용자 A의 토큰으로 사용자 B의 북마크를 조회·수정·삭제할 수 없다(기존 FEAT-001 API로 검증).
- [ ] AC-18 임시 Guard 제거(D-11): `x-dev-user-id` 헤더는 어떤 환경에서도 더 이상 인증 수단이 아니다.
- [ ] AC-19 시작 검증: `JWT_SECRET`(32바이트 이상)과 메일 설정이 없으면 운영 환경에서 서버가 시작하지 않는다. 오류 메시지에 값은 넣지 않는다.

## 데이터 계약

- 서버 소유 값: 사용자 ID, 이메일 인증 여부, 토큰 만료 시각, 세션 유효 여부, 요청 제한 판정.
- 프론트 전용 파생 값: 없음. Access Token 만료 직전 갱신 시점은 `expiresIn`을 그대로 쓴다.
- API 요청/응답/오류 (OpenAPI로 확정):

  | Method | Path                                | 요청                     | 성공                                       |
  | ------ | ----------------------------------- | ------------------------ | ------------------------------------------ |
  | POST   | /api/auth/signup                    | `{ email, password }`    | `202`                                      |
  | POST   | /api/auth/email-verification        | `{ token }`              | `204`                                      |
  | POST   | /api/auth/email-verification/resend | `{ email }`              | `202`(항상)                                |
  | POST   | /api/auth/login                     | `{ email, password }`    | `200 { accessToken, expiresIn }` + 쿠키    |
  | POST   | /api/auth/refresh                   | 쿠키                     | `200 { accessToken, expiresIn }` + 새 쿠키 |
  | POST   | /api/auth/logout                    | 쿠키                     | `204` + 쿠키 삭제                          |
  | POST   | /api/auth/password-reset            | `{ email }`              | `202`(항상)                                |
  | POST   | /api/auth/password-reset/confirm    | `{ token, newPassword }` | `204`                                      |
  | GET    | /api/me                             | Bearer                   | `200 { id, email, emailVerified }`         |
  - 쿠키를 쓰는 `refresh`·`logout`은 `Origin`이 `WEB_ORIGIN`과 같을 때만 처리한다(CSRF 방어, SameSite=Lax와 함께).
  - 오류는 공통 형태 `{ code, message, requestId, details? }`(ADR-006).

- 오류 문구(ADR-009, 서버 `message` 그대로 표시):

  | status | code                | 상황                                                                     | 문구                                                       |
  | ------ | ------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
  | 400    | INVALID_EMAIL       | 이메일 형식 오류                                                         | 올바른 이메일 주소가 아니에요.                             |
  | 400    | WEAK_PASSWORD       | 비밀번호 8자 미만 또는 128자 초과                                        | 비밀번호는 8자 이상 128자 이하로 입력해 주세요.            |
  | 400    | INVALID_TOKEN       | 인증·재설정 링크 만료/사용됨/없음                                        | 링크가 만료되었거나 이미 사용되었어요. 다시 요청해 주세요. |
  | 401    | INVALID_CREDENTIALS | 이메일 없음 또는 비밀번호 불일치                                         | 이메일 또는 비밀번호가 맞지 않아요.                        |
  | 401    | UNAUTHENTICATED     | Access Token 없음·오류·만료(기존 코드)                                   | 로그인이 필요해요.                                         |
  | 401    | SESSION_EXPIRED     | Refresh Token 없음·만료·폐기·재사용                                      | 다시 로그인해 주세요.                                      |
  | 429    | TOO_MANY_ATTEMPTS   | 요청 제한 초과                                                           | 시도가 너무 많아요. 잠시 후 다시 시도해 주세요.            |
  | 403    | INVALID_ORIGIN      | `refresh`·`logout`의 Origin이 WEB_ORIGIN과 다름(구현 중 추가, 승인 대기) | 잘못된 요청이에요.                                         |

- DB 변경/마이그레이션:
  - `users`: `email TEXT NULL`(정규화된 값) + 부분 UNIQUE `WHERE email IS NOT NULL`, `email_verified_at TIMESTAMPTZ NULL`. 이메일을 NULL 허용으로 두는 이유는 FEAT-004에서 이메일을 주지 않는 소셜 계정(예: Kakao 이메일 미동의)이 있기 때문이다.
  - `password_credentials(user_id PK FK, password_hash, updated_at)`: 비밀번호가 없는 계정(소셜·패스키 전용)이 생기므로 `users`와 분리.
  - `refresh_tokens(id, user_id, family_id, token_hash UNIQUE, expires_at, used_at, revoked_at, created_at)`, 인덱스 `(family_id)`, `(user_id)`.
  - `email_tokens(id, user_id, purpose['verify_email'|'reset_password'], token_hash UNIQUE, expires_at, used_at, created_at)`.
  - 기존 `users` 행(개발 데이터)은 `email`이 NULL로 남는다. 운영 데이터 없음.

## UX 및 디자인

- 이번 범위는 API만(Q-6). 웹 로그인·가입·재설정 화면과 프론트 토큰 처리(Access Token 메모리 보관, 401 시 Refresh 1회 후 재시도)는 별도 작업으로 바로 이어서 한다. 화면 디자인은 D-09 이후.
- 메일 본문: 텍스트 위주 최소 템플릿. 링크는 `WEB_ORIGIN` 기준.

## 영향도 및 주의사항

- 기존 Feature 및 회귀 위험:
  - `UserGuard` 내부를 JWT 검증으로 교체한다. 컨트롤러·`@CurrentUser()`는 그대로.
  - 기존 통합 테스트(`bookmarks.int.test.ts`)가 `x-dev-user-id`를 쓰므로 테스트용 토큰 발급 헬퍼로 바꾼다. 검증 강도는 낮추지 않는다.
- 캐시/호출 빈도/무효화: 캐시 없음. Access Token 검증은 서명만 확인(DB 조회 없음) → 요청당 DB 호출 증가 없음. 대신 로그아웃·재설정 후에도 기존 Access Token은 최대 15분 유효하다(알려진 트레이드오프, 2026-11-10 사용자 수용). 웹은 토큰을 메모리에만 두므로 정상 로그아웃은 즉시 반영되고, 남는 위험은 이미 탈취된 토큰뿐이다. 비밀번호 변경·탈퇴·패스키 등록 같은 민감한 API가 생기면 그 API에만 사용자별 세션 버전 검사를 붙인다(FEAT-005 등). 차단 목록(Redis)은 인프라 비용 때문에 쓰지 않는다.
- 메모리/동시성/비용/보안:
  - 동시성: 가입은 이메일 UNIQUE, 회전은 `UPDATE … WHERE used_at IS NULL AND revoked_at IS NULL RETURNING`이 승자를 정한다(앱 레벨 락 금지).
  - 보안: argon2id(라이브러리 기본 파라미터 이상), 토큰·비밀번호·이메일 전체를 로그에 남기지 않는다(이메일은 마스킹). 메일 링크의 토큰은 URL fragment가 아닌 query로 전달되므로 웹 화면은 읽은 즉시 주소에서 제거한다.
  - 배포 제약(D-12): Refresh 쿠키가 `SameSite=Lax`라서 웹과 API가 **같은 사이트**여야 전송된다. 서로 다른 도메인에 배포하면 동작하지 않는다. Next.js rewrite로 `/api`를 API로 프록시하거나 같은 상위 도메인의 서브도메인을 써야 한다.
  - 비용:
    - DB: `refresh_tokens`는 활성 사용자당 갱신마다 1행(15분 Access 기준 사용 중 시간당 최대 4행). 만료된 행은 하루 1회 정리(Q-7). `email_tokens`는 가입·재설정당 1행.
    - 외부 호출: 메일 발송(가입·재발송·재설정당 1통). Resend 무료 구간 내 운영 목표(ADR-011, 현재 한도는 계정 생성 시 확인). 요청 제한이 메일 폭탄·비용 폭주를 막는다.
    - 로그: 인증 실패 로그 증가분 소량.
- 롤백 및 데이터 호환성: 마이그레이션 down은 새 테이블 drop과 `users`의 추가 컬럼 drop. 롤백 시 임시 Guard 코드도 함께 되돌려야 API를 쓸 수 있다(같은 PR이므로 revert 한 번).

## 결정 사항 (2026-11-10, 사용자 승인)

- Q-1 가입 시 이메일 존재 여부: 숨긴다(AC-03). 대안 `409 EMAIL_TAKEN`은 구현이 단순하고 메일 1통을 아끼지만 가입 여부가 노출된다.
- Q-2 미인증 계정: 로그인·기존 기능 사용 허용(AC-06). 미인증 상태로 남의 이메일을 선점해도 실제 소유자가 비밀번호 재설정으로 계정을 되찾는다(AC-15). FEAT-004의 소셜 계정 연결은 인증된 이메일에만 허용한다.
- Q-3 토큰 수명: Access 15분, Refresh 14일(첫 로그인 기준 절대 만료), 회전 유예 10초. 로그아웃 후 Access 잔여 유효 시간은 수용(위 "캐시/호출 빈도/무효화").
- Q-4 요청 제한: `@nestjs/throttler` 메모리 저장. 단일 인스턴스 전제이며 재시작 시 초기화된다. 서버를 여러 대로 늘릴 때 Redis로 이전한다. 비용 없음.
- Q-5 유출 비밀번호 대조(HIBP k-익명성 API): 이번 범위 제외(외부 호출 추가). NIST 800-63B 권장 사항이라 이후 검토.
- Q-6 범위: API만. 웹 화면·프론트 토큰 처리는 별도 작업.
- Q-7 만료 토큰 정리: `@nestjs/schedule`로 하루 1회, 만료 후 1일 지난 `refresh_tokens`·`email_tokens` 행을 삭제한다. 1회 삭제 행 수에 상한을 두고 반복한다(긴 잠금 방지).
- 메일 발송: Resend(ADR-011). `RESEND_API_KEY`는 운영에서만 필수. 개발은 실제 발송 없이 인증·재설정 링크를 콘솔에 출력하고, 테스트는 메모리에 기록하는 어댑터를 쓴다. 링크 출력은 `development`에서만 한다.
- `JWT_SECRET`: 개발·테스트·운영 모두 필수(32바이트 이상). 코드에 기본값을 두지 않는다.
- 추가 의존성: `argon2`, `@nestjs/jwt`, `@nestjs/throttler`, `@nestjs/schedule`, `cookie-parser`, Resend SDK 또는 HTTP 호출(구현 계획에서 확정).

## 테스트 계획

테스트 이름은 `AC-xx: 동작 문장` 형식으로 수용 기준과 연결한다.

- Unit: 만료 토큰 정리 작업의 대상 선택·삭제 상한(Q-7), 이메일 정규화·비밀번호 정책(AC-02), 토큰 해시·만료 판정, Access Token 서명·만료 검증(AC-09), 환경 변수 검증(AC-19).
- Integration(실제 PostgreSQL): 가입·중복 가입(AC-01·03), 동시 가입 10개(AC-04), 인증·재설정 토큰 1회성·만료(AC-05·14·15), 로그인 성공/실패 동일 응답(AC-07·08), 회전(AC-10), 유예 후 재사용 시 묶음 폐기(AC-11), 동시 Refresh 20개 중 회전 1회(AC-12), 로그아웃 멱등(AC-13), 재설정 후 기존 Refresh 거부(AC-15), 요청 제한(AC-16), 교차 사용자 접근 거부(AC-17), `x-dev-user-id` 무시(AC-18). 메일은 테스트용 발송 어댑터로 대체해 발송 내용을 확인한다.
- E2E: 이번 범위 없음(API만). 웹 화면 작업에서 가입→인증→로그인→새로고침 후 유지→로그아웃.
- Regression: FEAT-001 통합 테스트 전체가 토큰 기반으로 통과.

## 구현 결과 (검증 후)

- 변경 파일/PR:
- 실행 명령 및 실제 결과:
- 남은 위험:
