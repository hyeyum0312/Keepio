# FEAT-004 — 소셜 로그인(Google·Kakao)과 계정 연결

- Status: Approved
- Updated: 2026-11-10
- Related: ADR-011(로그인 수단·세션 구조), FEAT-003(세션 발급 `SessionService`), FEAT-006(웹 토큰 처리·`/auth` 화면), ADR-009(오류 문구, 이번에 예외 추가), spec 03 인증 및 보안, OPEN-QUESTIONS D-04(모바일)·D-12(배포)

## 목적 및 비범위

- 사용자 문제: 비밀번호 없이 Google·Kakao 계정으로 가입·로그인하고, 같은 이메일의 기존 계정이 있으면 하나로 이어져야 한다.
- 이번 작업에서 하지 않는 것: Apple(iOS 출시 시, ADR-011), Naver, 로그인 상태에서 소셜 계정 연결·해제 화면, 연결된 계정 목록, 모바일 앱(WebView는 Google이 차단 — 앱은 시스템 브라우저 필요, D-04 PoC), 소셜 제공자 프로필 사진·이름 저장.

## 흐름

```
웹 [Google로 계속하기] → GET /api/auth/oauth/google/start
  → 302 Google 동의 화면 (state·nonce·PKCE는 서명된 단기 쿠키에 보관)
  → Google이 GET /api/auth/oauth/google/callback?code&state 로 돌려보냄
  → API: state 확인 → code 교환(PKCE) → ID 토큰 검증(서명·iss·aud·exp·nonce)
       → 계정 찾기·연결·생성(아래 정책) → SessionService.issue → Refresh 쿠키
  → 302 웹 /auth/callback → 웹이 refresh 1번으로 Access Token 받음(FEAT-006 그대로) → 홈
```

Access Token은 주소에 넣지 않는다(방문 기록·로그 노출 방지).

## 사용자 흐름 및 수용 기준

시작·콜백

- [ ] AC-01 시작: `GET /api/auth/oauth/:provider/start`는 제공자 동의 화면으로 302. 주소에 `state`·`nonce`·`code_challenge`(S256)·`scope=openid email`(Google은 `profile` 제외)이 있고, 같은 값의 원본(state·nonce·code_verifier)은 서명된 HttpOnly 쿠키(`keepio_oauth`, Path=/api/auth/oauth, 10분)에만 있다.
- [ ] AC-02 콜백 성공: 쿠키의 state와 주소의 state가 같고, code 교환과 ID 토큰 검증이 성공하면 세션을 발급(Refresh 쿠키)하고 `keepio_oauth` 쿠키를 지운 뒤 웹 `/auth/callback`으로 302.
- [ ] AC-03 위조·만료 거부: state 불일치, 쿠키 없음·만료·서명 불일치, 다른 제공자의 쿠키, ID 토큰 검증 실패(nonce 불일치 포함)면 세션을 만들지 않고 웹 `/login?oauth=failed`로 302. 이유는 서버 로그에만(이메일 마스킹, 토큰·code 미기록).
- [ ] AC-04 취소: 사용자가 동의를 거부하면(`error=access_denied`) 세션 없이 웹 `/login`으로 302(오류 표시 없음).
- [ ] AC-05 제공자 설정: 키(`*_CLIENT_ID`·`*_CLIENT_SECRET`)가 없는 제공자의 start·callback은 `404 NOT_FOUND`. `GET /api/auth/oauth/providers`는 사용 가능한 제공자 목록(`["google"]` 등)을 준다(버튼 표시의 권위).

계정 결정(한 트랜잭션)

- [ ] AC-06 재로그인: (provider, 제공자 사용자 ID)로 이미 연결된 계정이 있으면 그 계정으로 로그인한다. 이메일이 바뀌어도 같은 계정이다.
- [ ] AC-07 인증된 계정과 자동 연결: 제공자가 인증한 이메일(`email_verified=true`)이 **인증된** 기존 계정의 이메일과 같으면 그 계정에 연결하고 로그인한다. 기존 비밀번호·세션은 그대로.
- [ ] AC-08 인증 안 된 계정 회수: 제공자가 인증한 이메일이 **인증 안 된** 기존 계정의 이메일과 같으면 연결하되, 그 계정의 비밀번호를 지우고 모든 Refresh Token을 폐기하고 이메일을 인증으로 기록한다(남의 이메일로 미리 가입한 사람이 정한 비밀번호·세션을 무효화).
- [ ] AC-09 새 계정: 연결도 이메일 일치도 없으면 새 계정을 만든다. 제공자가 인증한 이메일이면 그 이메일을 인증 상태로 저장, 이메일이 없거나 인증 안 됐으면 이메일 없이 만든다.
- [ ] AC-10 동시 콜백: 같은 제공자 계정으로 콜백이 동시에 여러 번 와도(두 번 클릭 등) 연결은 1개, 계정도 1개다(DB UNIQUE가 최종 권위).

웹

- [ ] AC-11 버튼: 로그인·가입 화면에 사용 가능한 제공자 버튼만 보인다(`/providers`). 누르면 페이지 전체가 API start로 이동한다.
- [ ] AC-12 콜백 화면(`/auth/callback`): refresh 1번으로 로그인 상태를 받아 홈으로 이동. 실패하면 `/login?oauth=failed`.
- [ ] AC-13 실패 안내: `/login?oauth=failed`면 고정 문구 "소셜 로그인에 실패했어요. 다시 시도해 주세요."를 alert로 보여 주고, 읽은 뒤 주소에서 `oauth` 값을 지운다(ADR-009 예외, 아래).

## 데이터 계약

- 서버 소유 값: 사용 가능한 제공자 목록, 계정 연결 결정, 이메일 인증 여부.
- 프론트 전용 파생 값: 없음.
- API:

  | Method | Path                               | 응답                                              |
  | ------ | ---------------------------------- | ------------------------------------------------- |
  | GET    | /api/auth/oauth/providers          | `200 { providers: ("google" \| "kakao")[] }`      |
  | GET    | /api/auth/oauth/:provider/start    | `302` 제공자 동의 화면 + `keepio_oauth` 쿠키      |
  | GET    | /api/auth/oauth/:provider/callback | `302` 웹 `/auth/callback` 또는 `/login?oauth=...` |

- 오류 문구: start·callback은 브라우저 이동이라 JSON 문구를 줄 수 없다. **ADR-009 예외(ADR-012)**: 리디렉션 흐름의 실패는 웹 `shared`의 고정 문구 1개로 안내한다(서버 무응답 문구와 같은 취급). 실패 이유는 사용자에게 구분해 보여 주지 않는다.
- DB 변경/마이그레이션:
  - `oauth_accounts(id, user_id FK CASCADE, provider enum('google','kakao'), subject, created_at)`, UNIQUE `(provider, subject)`, INDEX `(user_id)`. 제공자의 이메일·이름·사진·토큰은 저장하지 않는다(로그인에 불필요, 개인정보 최소화).
- 환경 변수: `GOOGLE_CLIENT_ID`·`GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`(REST API 키)·`KAKAO_CLIENT_SECRET`, `API_ORIGIN`(콜백 주소의 기준, 로컬 `http://localhost:7711`; 운영에서 제공자를 하나라도 켜면 필수). ID·Secret 둘 다 있어야 그 제공자가 켜진다.
- 라이브러리: `openid-client` 6.8.8(OpenID Certified, discovery·PKCE·ID 토큰 검증). 6.8.9는 공개 14일 전이라 제외.

## UX 및 디자인

- 기능 위주 최소 UI(D-09 전). 버튼 문구 "Google로 계속하기", "카카오로 계속하기". 제공자 브랜드 가이드(로고·색)는 디자인 시스템 작업에서 적용한다.
- 콜백 화면은 "로그인하는 중이에요…"만.

## 영향도 및 주의사항

- 기존 Feature 및 회귀 위험: FEAT-003 세션 발급·Refresh 쿠키를 그대로 쓴다. AC-08은 기존 계정의 비밀번호를 지우므로 통합 테스트로 범위를 고정한다. FEAT-006 로그인·가입 화면에 버튼 추가.
- 캐시/호출 빈도/무효화: 제공자 discovery 문서·JWKS는 `openid-client`가 프로세스 메모리에 캐시(시작 후 첫 로그인 때 1회 조회). `/providers`는 웹에서 화면 진입 시 1회.
- 메모리/동시성/비용/보안:
  - 동시성: `(provider, subject)` UNIQUE와 `users.email` 부분 UNIQUE가 승자를 정한다. 충돌하면 다시 조회해 같은 계정으로 로그인.
  - 보안: state(CSRF)·nonce(재전송)·PKCE(code 가로채기) 모두 사용. 쿠키는 JWT_SECRET 기반 HMAC 서명. 이메일 자동 연결은 제공자가 `email_verified=true`라고 할 때만. Kakao의 이메일 인증 여부 값은 구현 시 공식 문서로 확인한다(가정: OIDC ID 토큰·userinfo에 `email_verified` 제공).
  - 외부 호출: 로그인 1회당 제공자 token 엔드포인트 1회(+ 첫 로그인 시 discovery·JWKS). timeout 5초.
  - 요청 제한: start·callback에 IP 분당 10회(FEAT-003 IP 제한과 같은 기준).
  - 비용: Google·Kakao 무료. DB는 소셜 계정당 1행.
- 롤백 및 데이터 호환성: 마이그레이션 down은 `oauth_accounts`·enum drop(소셜 전용 계정은 로그인 수단을 잃는다 — 운영 데이터 생긴 뒤에는 롤백 전 공지 필요). 지금은 운영 데이터 없음.

## 테스트 계획

테스트 이름은 `AC-xx: 동작 문장` 형식으로 수용 기준과 연결한다.

- Unit: 쿠키 서명·검증·만료·제공자 일치(AC-01·03), 제공자 설정 판정(AC-05).
- Integration(실제 PostgreSQL, 제공자는 가짜 클라이언트로 대체): start 302·쿠키(AC-01), 콜백 성공 세션 발급(AC-02), state·쿠키·nonce 위조(AC-03), 취소(AC-04), 미설정 404(AC-05), 계정 결정 4가지(AC-06~09), 동시 콜백 10개 → 연결 1·계정 1(AC-10, 도착 후 일괄 진행), AC-08 후 기존 비밀번호 로그인 실패·기존 Refresh 거부.
- Web(Vitest): 버튼 표시·이동(AC-11), 콜백 화면 성공·실패(AC-12), 실패 문구·주소 정리(AC-13).
- Manual: 실제 Google 계정으로 가입 → 로그아웃 → 재로그인, 같은 이메일의 비밀번호 계정과 연결 확인. Kakao는 키 발급 후.

## 구현 결과 (검증 후)

- 변경 파일/PR:
- 실행 명령 및 실제 결과:
- 남은 위험:
