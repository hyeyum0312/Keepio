# FEAT-006 — 웹 로그인 화면과 토큰 처리

- Status: Implemented
- Updated: 2026-11-10 (AC-12 비로그인 홈 = 랜딩)
- Related: FEAT-003(API·Q-6), ADR-011(웹 토큰 저장), ADR-009(오류 문구), FRONTEND standards(Structure·Network/state), OPEN-QUESTIONS D-09(디자인)·D-12(배포)

## 목적 및 비범위

- 사용자 문제: 웹에서 가입·로그인하고, 새로고침해도 로그인이 유지되고, 비밀번호를 잊으면 되찾을 수 있어야 한다. FEAT-003 이후 북마크 API는 Access Token 없이 401이라 웹에 토큰 처리가 필요하다.
- 이번 작업에서 하지 않는 것: 디자인 시스템·시각 디자인(D-09, 기능 위주 최소 화면만), 소셜·패스키 버튼(FEAT-004·005), 탭 간 로그아웃 동기화, 로그인 후 원래 페이지로 돌아가기(`?next=`, 열린 리다이렉트 검토 필요), 모바일 WebView, E2E 도구 도입.

## 사용자 흐름 및 수용 기준

토큰 처리

- [x] AC-01 메모리 보관: Access Token은 JS 메모리에만 둔다. localStorage·sessionStorage·쿠키에 쓰지 않는다. Refresh Token은 서버의 HttpOnly 쿠키라 JS가 다루지 않는다.
- [x] AC-02 자동 첨부: API 요청에 Access Token이 있으면 `Authorization: Bearer`를 붙인다. 모든 요청은 `credentials: "include"`.
- [x] AC-03 401 처리: 보호된 요청이 `401 UNAUTHENTICATED`이면 refresh를 1번 호출하고 성공하면 원래 요청을 1번만 다시 보낸다. 재시도도 401이면 더 반복하지 않는다. 인증 API(`/api/auth/*`) 자체의 401에는 refresh를 시도하지 않는다.
- [x] AC-04 refresh 묶기: 동시에 여러 요청이 401을 받아도 refresh 요청은 1번만 나가고, 모두 그 결과를 기다린다.
- [x] AC-05 refresh 실패: refresh가 실패하면 토큰과 사용자 캐시를 비우고 비로그인 상태가 된다. 보호된 화면에 있었으면 `/login`으로 이동한다.
- [x] AC-06 새로고침 유지: 앱이 시작될 때 refresh를 1번 시도해 로그인 상태를 되살린다. 결과가 나오기 전에는 보호된 화면에 로딩만 보여 준다(로그인 화면으로 깜빡이지 않는다).

화면

- [x] AC-07 가입(`/signup`): 이메일·비밀번호로 가입하면 "인증 메일을 보냈어요" 안내를 보여 준다. 서버 오류는 `message`를 그대로 보여 준다.
- [x] AC-08 이메일 인증(`/verify-email?token=`): 주소의 토큰을 읽은 즉시 주소에서 지우고(뒤로 가기·기록에 남지 않게) 인증을 요청한다. 성공·실패를 보여 주고, 실패면 서버 문구와 재발송 입력을 보여 준다.
- [x] AC-09 로그인(`/login`): 성공하면 홈으로 이동한다. 실패하면 서버 문구를 보여 준다. 이미 로그인 상태면 홈으로 보낸다.
- [x] AC-10 비밀번호 찾기(`/forgot-password`): 이메일을 보내면 가입 여부와 무관하게 같은 안내("가입된 이메일이면 메일을 보냈어요")를 보여 준다.
- [x] AC-11 재설정(`/reset-password?token=`): 토큰을 읽은 즉시 주소에서 지운다. 새 비밀번호로 재설정하면 로그인 화면으로 안내한다. 오류(만료·약한 비밀번호)는 서버 문구를 보여 준다.
- [x] AC-12 홈·로그아웃: 홈(`/`)은 로그인 상태면 계정 화면(내 이메일·인증 여부 `/api/me`, 로그아웃), 비로그인이면 랜딩(제품 소개·시작하기·로그인, 02-DESIGN 정보 구조)을 같은 주소에서 보여 준다. 로그아웃하면 서버 세션을 끊고 토큰·캐시를 비우고 같은 주소에서 랜딩이 된다. (2026-11-10 변경: 비로그인 홈을 `/login` 리다이렉트 대신 랜딩으로)
- [x] AC-13 중복 제출 방지: 요청 중에는 제출 버튼을 비활성화한다.
- [x] AC-14 접근성: 모든 입력에 라벨, 오류는 `role="alert"`로 알리고 입력과 연결, 키보드만으로 모든 흐름 가능.

## 데이터 계약

- 서버 소유 값: 로그인 여부(토큰 유효성), 이메일 인증 여부(`/api/me`), 모든 오류 문구, 비밀번호 정책.
- 프론트 전용 파생 값: 인증 상태 `checking | authenticated | anonymous`(refresh 결과에서 파생), 제출 중 여부. 비밀번호 길이 안내 문구는 입력 도움말로만(`minLength` 속성), 판단은 서버.
- API: FEAT-003 그대로. 새 API 없음. `packages/api-client`의 `apiFetch`에 토큰 공급·refresh 연결 지점만 추가(생성물은 손대지 않음).
- 오류 문구(ADR-009): 서버 `message` 그대로. 서버 응답이 없을 때(오프라인·타임아웃)만 `shared`의 고정 문구 1개.
- DB 변경/마이그레이션: 없음.

## UX 및 디자인

- 기능 위주 최소 화면: 기본 HTML 폼 + 최소 Tailwind(간격·폭). 색은 쓰지 않거나 기존 토큰만(색 리터럴 lint). D-09 이후 `ui/`만 교체한다.
- 로딩: 인증 확인 중 보호 화면은 로딩 문구. 제출 중 버튼 비활성.
- 랜딩: 제품명·기존 태그라인·한 줄 설명·사용 흐름(저장 → 정리 → 버킷 → 발행)·시작하기/로그인만. 02-DESIGN의 "실제 발행물 예시"는 발행 기능 이후. 로그인 여부는 브라우저에서만 알 수 있어 첫 화면은 로딩 후 랜딩이 그려진다(검색 노출이 필요해지면 랜딩을 정적 렌더하는 구조로 재검토).

## 영향도 및 주의사항

- 기존 Feature 및 회귀 위험: `apiFetch` 변경은 모든 API 호출에 영향. 토큰이 없을 때는 지금과 같은 요청을 보낸다.
- 캐시/호출 빈도/무효화:
  - `/api/me` 쿼리: 키는 Orval 생성 키, 소유 `features/auth`, stale은 기본값, 로그인 성공 시 다시 받고 로그아웃·refresh 실패 시 제거.
  - refresh: 앱 시작 1회 + 401 때만. 주기적 갱신 타이머 없음(Access 만료 후 첫 요청이 401 → refresh 1회).
- 메모리/동시성/비용/보안:
  - 동시 refresh는 진행 중인 Promise 하나를 공유(AC-04). React StrictMode의 이중 실행에도 1번.
  - 토큰을 로그·URL·저장소에 남기지 않는다. 메일 링크 토큰은 `history.replaceState`로 즉시 제거.
  - 다른 탭의 로그아웃은 이 탭에 즉시 반영되지 않는다(다음 refresh에서 401). 비범위.
  - 로컬은 웹 `localhost:7710`·API `localhost:7711`이 같은 사이트라 SameSite=Lax 쿠키가 전송된다. Secure 쿠키를 http localhost에서 받는 동작은 브라우저마다 다를 수 있어 수동 확인 필요(Chrome 우선).
  - 비용: 없음(앱 시작 시 refresh 1회 추가).
- 롤백 및 데이터 호환성: revert. 데이터 영향 없음.

## 테스트 계획

테스트 이름은 `AC-xx: 동작 문장` 형식으로 수용 기준과 연결한다.

- Unit(Vitest): 토큰 저장소·refresh 묶기(동시 401 N개 → refresh 1회, AC-04), 401 재시도 1회·무한 반복 없음·인증 API 제외(AC-03), refresh 실패 시 초기화(AC-05), 토큰 첨부(AC-02).
- Component(Testing Library, fetch 대체): 각 폼의 성공·서버 오류 문구 그대로 표시·제출 중 비활성(AC-07~13), 토큰 주소 제거(AC-08·11), 보호 화면 리다이렉트·로딩(AC-06·12), 라벨·alert(AC-14).
- Manual(실제 브라우저, 실제 API·DB): 가입 → 콘솔 링크로 인증 → 로그인 → 새로고침 유지 → 로그아웃 → 재설정. 결과는 QA 보고서에.
- Regression: api-client를 쓰는 기존 web 테스트 통과.

## 구현 결과 (검증 후)

- 변경 파일/PR: 브랜치 `feature/auth-web`. `apps/web/src/features/auth/**`(session-store·refresh-session·auth-fetch·useOneTimeUrlToken·useAuthStatus·화면 컴포넌트), `features/landing`, `app/{login,signup,verify-email,forgot-password,reset-password}`, `app/page.tsx`·`providers.tsx`, `shared/lib/network-error.ts`, `packages/api-client/src/api-fetch.ts`(fetch 주입 지점).
- 실행 명령 및 실제 결과(2026-11-10, 로컬):
  - web 단위·컴포넌트 25개 PASS(authFetch 8: 첨부·401 재시도 1회·무한 반복 없음·인증 API 제외·동시 5개 → refresh 1회·실패 시 초기화 / 화면: 서버 문구 alert·aria 연결·제출 중 비활성·StrictMode에서 인증 요청 1회·주소 토큰 제거·홈 로딩/랜딩/계정 전환·로그아웃 후 랜딩).
  - `npm run verify` PASS(8/8), `npm run build` PASS(라우트 정적). 빌드에서 클라이언트 훅이 서버 컴포넌트 경로에 섞인 것을 발견해 분리.
  - 실제 API에 웹 출처 CORS 사전 요청 확인(Allow-Origin·Credentials·authorization 헤더).
  - 브라우저(Chrome, 사용자 수동): 비로그인 홈 → 가입 202·API 콘솔에 인증 링크 출력 확인. 이후 FEAT-004 브랜치에서 Google 로그인 → `/auth/callback` → refresh(다른 포트 API로 Refresh 쿠키 전송)·`/api/me`·홈·로그아웃·재로그인 정상(사용자 보고).
- 남은 위험:
  - 브라우저 수동 미확인: 새로고침 후 로그인 유지, 이메일 인증 링크 화면, 비밀번호 재설정 화면(컴포넌트 테스트로만 검증).
  - 랜딩은 로그인 확인 후 그려져 검색 엔진에는 로딩 문구만 보인다(출시 전 재검토).
  - 다른 탭 로그아웃은 즉시 반영되지 않는다(비범위).
