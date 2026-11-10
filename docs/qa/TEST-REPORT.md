# QA Execution Report

AI는 실행 시각, 커밋 SHA, 명령, 통과/실패, 미실행 사유, 잔여 위험을 이 파일에 기록한다. 성공을 추정해서 작성하지 않는다. 최신 기록을 위에 둔다.

## 2026-11-10 | FEAT-003 이메일/비밀번호 인증 (브랜치 `feature/auth-email-password`)

환경: macOS 로컬, Node 24, PostgreSQL 16(docker compose), `.env`의 `JWT_SECRET`.

| 항목                           | 명령                                                 | 결과                                                                                |
| ------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 전체 게이트                    | `npm run verify`                                     | PASS 8/8                                                                            |
| api 단위                       | `npx vitest run`(apps/api)                           | PASS 105 (메일 발송 큐 6 포함)                                                      |
| 통합(실제 DB)                  | `npm run test:integration`                           | PASS 55 (auth 27, session 10, cleanup 2, bookmarks 14, health 2)                    |
| 동시 가입                      | AC-04, 10개 도착 후 일괄                             | 계정 1개                                                                            |
| 동시 Refresh                   | AC-12, 20개 도착 후 일괄                             | 회전 1회, 묶음 미폐기                                                               |
| 변이: 가입 `ON CONFLICT` 제거  | AC-04 3회                                            | 3/3 실패 → 복구 후 PASS                                                             |
| 변이: 회전 `usedAt: null` 제거 | AC-12 3회                                            | 3/3 실패 → 복구 후 PASS                                                             |
| 실제 서버 스모크               | `node dist/main.js`(PORT 7799) + curl                | health up, signup 202, 콘솔 인증 링크 1건, login 200, me 200, refresh 200           |
| 메일 백그라운드 발송           | 발송을 멈춘 상태에서 재설정·재발송·가입(통합 테스트) | 모두 즉시 202                                                                       |
| 실제 서버 종료 처리            | signup 직후 SIGTERM                                  | 콘솔 메일 출력 후 정상 종료, 오류 로그 없음. signup 0.09s, 없는 이메일 재설정 0.01s |

미실행·제한:

- 실제 Resend 발송: 운영 키 없음. `ResendMailSender`는 단위 테스트(요청 형태·AbortSignal·오류 시 주소 비노출)만.
- 웹 화면·E2E: 범위 밖(Q-6).
- CI 실행: push 전이라 미실행.

## 2026-10-30 | 세팅 게이트 검증 (기준 dev `a004a6a`)

목적: 기능 구현 전에 각 게이트가 실제 위반을 막는지 확인한다. 위반은 버릴 브랜치·scratch worktree에서만 넣었고 push하지 않았다. 찾은 공백(G1~G7)은 같은 PR에서 고치고, 고친 뒤 같은 케이스로 다시 확인했다.

| 게이트                         | 케이스                                                                                                                                                                                                               | 수정 전                       | 수정 후                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| 편집 hook (`post-edit.sh`)     | 색상 리터럴(`"#ff0000"`, `bg-[#fff]`), 파일명(`bad_name.ts`, api `BadName.ts`), `it.only`·assert 없는 테스트, `@/features/x/ui/X`, shared→`@/features/x`, 들여쓰기 깨진 파일                                         | 전부 차단, Prettier 자동 적용 | -                                                         |
| `verify`(lint)                 | hook과 같은 위반 파일                                                                                                                                                                                                | 전부 차단                     | -                                                         |
| web 경계 lint                  | G1 feature 최상위 파일 `../b/ui/B` · G2 `app/`에서 `../features/b/ui/B` · G3 shared에서 `../features/b`                                                                                                              | **통과(공백)**                | 차단                                                      |
| web 경계 lint                  | G7 같은 feature 안 `ui/forms/X`→`../../model/x`                                                                                                                                                                      | **차단(오탐)**                | 통과                                                      |
| web 경계 lint                  | 회귀: `@/features/b/ui/B`(app·다른 feature), `../../b/ui/B`, shared→`@/features/b` 차단 / `@/features/b`·`../features/b`(index), 같은 feature 상대 경로 통과                                                         | -                             | 기대대로                                                  |
| web 경계 lint                  | `apps/web/src`에서 실행(cwd ≠ 설정 위치)                                                                                                                                                                             | -                             | basePath 없으면 0건 감지, 있으면 3건 감지 → basePath 고정 |
| pre-commit                     | HISTORY 누락 · 포맷 위반(json) · 관련 테스트 실패 · `dev`에서 커밋                                                                                                                                                   | 전부 차단                     | -                                                         |
| pre-commit                     | G4 HISTORY 누락 시 메시지                                                                                                                                                                                            | **차단되지만 출력 없음**      | 오류와 조치 안내 출력                                     |
| `openapi:check`                | 생성물 직접 수정 · api 코드만 수정(enum 값 추가)                                                                                                                                                                     | 둘 다 실패 + 재생성           | -                                                         |
| `ci-scope.sh`                  | web만 → web · api-client만 → api-client+web · api만 → api · lockfile의 web/api 의존성 → 해당 패키지 · 루트 prisma CLI 버전(package.json+lock) → 전체 · turbo.json → 전체 · prisma 스키마 → 전체 · docs만 → 없음      | 기대대로                      | 같음(회귀 확인)                                           |
| `ci-scope.sh`                  | G5 `prisma.config.ts`만 · G6 `.nvmrc`만                                                                                                                                                                              | **검사 대상 없음**            | 전체 검사                                                 |
| GitHub ruleset                 | dev·stg·prod: PR 필수, `verify` 필수, bypass 없음(API 조회). 승격 PR #13 `verify` 통과 후 merge, 금지 경로 PR #10 `verify` 실패                                                                                      | 기대대로                      | -                                                         |
| 새 clone (`docs/SETUP.md` 3-4) | GitHub clone → `npm install`(hooksPath 연결) → env 복사 → `db:status`(최신) → `dev:api` `/health` `{"status":"ok","db":"up"}`, `/docs` 200 → `verify` 8/8 → `build` 3/3 → `db:migrate:test` → `test:integration` 2/2 | 통과                          | -                                                         |

미실행·제한:

- 새 clone에서 `db:up`·`db:deploy`는 실행하지 않았다. 기존 `keepio` 컨테이너가 같은 compose 프로젝트 이름으로 떠 있어 재생성될 수 있어서, 이미 실행 중인 DB와 읽기 전용 `db:status`로 대체했다.
- `/feature`·`/finish` 스킬은 실제 실행하지 않았다. FEAT-001 명세 작성 때 처음 실행한다.
- 저장소 루트에서 `eslint -c apps/web/eslint.config.mjs`로 실행하면 ESLint가 cwd를 기준으로 `files`를 맞춰 web 규칙 전체(색상 규칙 포함)가 적용되지 않는다. ESLint 동작이며 이번 범위 밖이다.
- `npm install` 시 보류되는 설치 스크립트 목록(esbuild, unrs-resolver 등)이 `SETUP.md`의 예시와 다르다. 위 clone 검증이 이 상태로 통과했다.
