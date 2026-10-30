# keepio Development History

> 단일 파일·최신순 누적. 실제 변경의 원본은 Git이다. 이 파일에는 변경 이유·영향·검증 결과만 기록한다.
> 실제로 실행하지 않은 검증은 통과로 기록하지 않는다. 형식: `docs/standards/HISTORY.md`.

<!-- 새 기록은 이 주석 바로 아래, 기존 기록 위에 추가한다. -->

## 2026-10-30 | chore(web): 로컬에서 web이 api를 호출하도록 개발용 사용자 연결

- Feature: N/A (FEAT-001 D-11 연결)
- 목적: 사용자가 프론트 화면을 직접 짤 수 있게 한다. api가 사용자 헤더를 요구해 web 요청이 모두 401이었다.
- 변경: `prisma/seed-dev-user.sql` + `npm run db:seed:dev`(고정 개발 사용자, 재실행 안전). `configureApiClient`에 기본 헤더 옵션(요청별 헤더가 우선). web `providers.tsx`가 개발·테스트 모드에서만 `x-dev-user-id`를 붙인다. SETUP 설치·명령·문제 해결.
- 영향: 로컬 개발만. 운영 빌드는 헤더를 보내지 않고, api도 운영에서는 항상 401. CORS는 변경 없음(cors 기본값이 요청 헤더를 허용, 실제 사전 요청으로 확인).
- 검증: `npm run db:seed:dev` 2회(두 번째도 성공, 사용자 1명) 확인. web `providers.test.tsx` PASS(2, 헤더 부착·요청별 헤더 유지 추가). 빌드한 api를 띄워 Origin `localhost:7710` 사전 요청 204 + `Access-Control-Allow-Headers: content-type,x-dev-user-id`, 저장 201 → 재저장 200 확인(개발 DB에 북마크 1건 남음). `npm run verify` PASS(8/8), `npm run build` PASS. 운영 web 번들(`.next/static`)에 `x-dev-user-id`·개발 사용자 ID 0건.
- 주의/롤백: revert로 롤백. 개발 사용자 ID는 SQL과 `providers.tsx` 두 곳에 있다(서로 주석으로 참조).

## 2026-10-30 | feat(bookmarks): 링크 저장 API — URL 정규화와 동시 저장 중복 방지

- Feature: FEAT-001
- 목적: `POST /api/bookmarks`로 링크를 저장하고, 같은 링크(정규화 기준)는 동시에 100번 요청돼도 하나만 남게 한다. 첫 도메인 모듈.
- 변경: `users`·`bookmarks` 테이블(UUID, 부분 UNIQUE `(user_id, normalized_url) WHERE deleted_at IS NULL` — Prisma `partialIndexes` preview, 길이 CHECK는 SQL). `bookmarks` 모듈(정규화 순수 함수, `ON CONFLICT DO NOTHING` + 승자 재조회, 201/200, 409 `bookmarkId`). `auth` 모듈(D-11 개발·테스트 전용 `UserGuard`, 운영 항상 401). `ApiException` 추가 필드. OpenAPI·클라이언트 재생성. BACKEND(raw SQL 규칙, 부분 인덱스·CHECK·롤백 블록, 트랜잭션은 필요한 첫 기능에서), QUALITY(동시성 테스트는 경합을 강제), OPERATIONS(수익 전 반복 비용은 사용자 승인), spec 04, AI-LOG 3건.
- 영향: 새 테이블 2개, 북마크당 행 1개·인덱스 2개. 외부 호출 없음. `UserGuard`가 헤더를 믿으므로 인증(D-04) 전에는 배포하지 않는다(운영에서는 항상 401).
- 검증: `npm run verify` PASS(8/8). `npm run test:integration` PASS(14: bookmarks 12, health 2). `npm run build` PASS. api 단위 41개 PASS. AC-03 100개 동시 요청 88~209ms(로컬 6회), 100개 모두 INSERT 도달 assert. `ON CONFLICT` 제거 변이 5회 모두 실패. 스키마 변경 없이 다시 만든 마이그레이션이 비어 있음(Prisma가 CHECK·부분 인덱스를 지우지 않음) 확인 후 삭제.
- 주의/롤백: 코드는 revert. DB는 마이그레이션 끝의 롤백 블록(`DROP TABLE bookmarks; DROP TABLE users;` + `_prisma_migrations` 행 삭제). 운영 데이터 없음. `partialIndexes`는 preview라 Prisma 업그레이드 때 마이그레이션 diff를 확인한다.

## 2026-10-30 | docs(feature): FEAT-001 명세 확정, 기능 구현 단계 시작

- Feature: FEAT-001
- 목적: 사용자 지시로 기본 세팅에서 기능 구현 단계로 전환하고, FEAT-001의 남은 결정을 확정해 승인받는다.
- 변경: AGENTS 현재 단계를 "기능 구현(Phase 1)"으로. `bookmark-save.md` Approved — 추적 파라미터 8개, 입력·정규화 결과 2048자 상한(B-tree 인덱스 항목 한계), 신규 201/기존 200, 오류 문구 표(ADR-009), 빈 값은 INVALID_URL·필드 없음은 VALIDATION_FAILED. spec 04 URL 정책에 같은 내용.
- 영향: 문서만. 이후 FEAT-001 구현이 이 명세를 기준으로 한다.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백. 추적 파라미터 목록을 바꾸면 기존 저장분의 정규화 결과가 달라진다.

## 2026-10-30 | docs(git): PR은 목적 단위로 묶고 배포 전에는 승격하지 않음 (ADR-010)

- Feature: N/A
- 목적: 작은 정리마다 PR을 열어 merge 부담이 크고 동시 PR끼리 HISTORY가 충돌했다. 배포 환경이 없어 승격 PR은 하는 일이 없다(사용자 결정).
- 변경: `BRANCHING.md` 10번(기능·요청 묶음 = 브랜치 하나 = PR 하나, 열린 PR이 같은 목적이면 커밋 추가), 환경 절(배포 환경 전 승격 중단). ADR-010.
- 영향: 이후 작업 흐름만. 작업 브랜치 → `dev` PR·CI 필수·보호 규칙은 그대로. `stg`는 승격 재개 때까지 `dev`보다 뒤처진다.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | fix(git): AI 작성자 표시 검사가 생성 문구를 링크 형태로만 잡도록

- Feature: N/A
- 목적: 직전 커밋의 첫 CI에서 PR 본문의 패턴 설명(링크 없는 "Generated with [Claude")이 오탐으로 실패했다.
- 변경: `check-ai-attribution.sh` 생성 문구 패턴에 링크(`](http`)를 요구. 실제 자동 표시는 항상 `Generated with [Claude Code](https://…)` 형태다.
- 영향: 규칙을 설명하는 PR·커밋 본문이 통과한다. trailer 검사는 그대로.
- 검증: 메시지 fixture 10개 기대대로(차단 5 / 통과 5, 링크 없는 생성 문구 설명 추가). 실제 PR #22 제목·본문 `--stdin` 통과. `origin/dev` 전체 검사는 여전히 28개 탐지.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | chore(git): 커밋·PR의 AI 작성자 표시를 hook과 CI로 차단

- Feature: N/A
- 목적: GitHub 기여자 그래프에 claude가 다시 올라가지 않게 한다(사용자 결정: 무조건 차단). PR #11의 설정(`attribution`)은 Claude Code 자동 표시만 끄므로, AI가 직접 쓰거나 다른 환경에서 커밋하면 다시 들어갈 수 있었다. squash merge는 PR 커밋 메시지를 그대로 dev 커밋에 옮긴다.
- 변경: `scripts/check-ai-attribution.sh`(줄 맨 앞의 `Co-Authored-By: …claude/anthropic` trailer, `Generated with [Claude` 링크 문구 탐지, 대소문자 무시). `.githooks/commit-msg`. CI에 PR 커밋·제목·본문 검사 단계. `BRANCHING.md` AI 에이전트 규칙, `QUALITY.md` 로컬 게이트, AI-LOG 1건(표 열 너비 재정렬 포함).
- 영향: 이후 모든 커밋과 PR. dev에 이미 있는 커밋은 CI 검사에서 제외한다 — 제외하지 않으면 표시 금지 전 커밋(`stg`에만 있는 #9)이 다음 stg→prod 승격 PR을 영구히 막는다. 기존 28개 커밋의 표시와 그래프 숫자는 그대로 남는다(히스토리 재작성 안 함).
- 검증: 첫 커밋 시도에서 이 커밋 본문의 설명 문장("Co-Authored-By: Claude 등을 거부한다")이 오탐으로 거부됨 → 줄 시작 고정으로 수정. 메시지 fixture 9개 기대대로(차단 5: 표준 trailer·소문자·Generated 링크·anthropic 이메일·들여쓴 trailer / 통과 4: 주석 줄·본문의 "Claude Code" 단어·사람 공동 작성자·규칙 설명 문장). 실제 이력: `origin/stg --not origin/prod`는 231e3b2로 실패, `origin/dev`를 제외하면 통과, `origin/dev` 전체는 28개 모두 탐지. `--stdin` 통과·차단 확인. trailer를 넣은 실제 `git commit`이 commit-msg hook에서 거부되고 HEAD가 그대로임을 확인. `npm run format:check` PASS. CI 단계는 이 PR에서 처음 실행.
- 주의/롤백: revert로 롤백. 검사가 오탐하면 hook을 우회하지 말고 패턴을 고친다.

## 2026-10-30 | feat(api): 오류 응답 message를 사용자 문구로 (ADR-009)

- Feature: N/A
- 목적: 프론트가 오류 문구를 만들거나 바꾸지 않고 서버 `message`를 그대로 보여주게 한다(사용자 결정). 문구를 한 곳에서 관리하고, 서버가 권위 있는 값을 주는 원칙과 맞춘다.
- 변경: `api-exception.filter.ts`의 고정 문구(검증 실패·404·500)를 한국어 사용자 문구로 바꾸고, 도메인 예외가 아닌 HTTP 예외는 Nest 원래 메시지 대신 공통 문구를 쓴다. `ApiErrorResponse.message`에 OpenAPI 설명 추가 → `openapi:generate`. ADR-009, `BACKEND.md` Errors, `FRONTEND.md` Errors, `FEATURE-TEMPLATE.md` 오류 문구 표.
- 영향: 모든 오류 응답의 `message` 값이 바뀐다(`code`·형태는 그대로). 현재 `message`를 읽는 클라이언트 코드는 없다. 이전에 그대로 나가던 비도메인 HTTP 예외 메시지가 더 이상 노출되지 않는다.
- 검증: `npm run test:related -w @keepio/api` PASS(2 files, 9 tests, 403 비노출 테스트 추가). `npm run verify` PASS(8/8). 통합 테스트는 로컬 미실행(DB 쿼리 변경 없음, CI에서 실행).
- 주의/롤백: revert로 롤백. 문구는 계약이 아니므로 테스트·클라이언트가 문구로 분기하지 않는다.

## 2026-10-30 | docs(standards): 백엔드 모듈 구조·마이그레이션·테스트 관례 정리

- Feature: N/A
- 목적: 첫 도메인 모듈(FEAT-001) 전에 `apps/api` 안에서 모듈을 어디에 어떻게 만들지 문서로 고정한다. 지침 점검에서 찾은 공백과 불일치를 정리한다(사용자 승인).
- 변경: `BACKEND.md`에 Structure(`src/<domain>/` 평면 배치 — 기존 `health`·Nest CLI 기본과 같음, 파일 역할·이름, service는 repository 경유, 모듈 간 `exports`만 사용, 사용자 식별은 guard+decorator)와 Migrations and tests(raw SQL 제약은 같은 마이그레이션에, 적용된 마이그레이션 수정 금지, down 없음 → 롤백은 HISTORY에) 추가. 모듈 목록은 spec 03을 원본으로. 트랜잭션 전달 방식·롤백 기록 형식은 FEAT-001에서 정해 반영. `FRONTEND.md` 버전 표기를 메이저만(실제 React 19.3.1과 어긋나 있었음). spec 03 폴더 구조에 아직 없는 `worker`·`mobile`·`shared`를 `(예정)`으로 표시.
- 영향: 문서만. git 미추적 빈 폴더 `apps/api/src/modules/health`를 로컬에서 삭제(커밋 영향 없음).
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | docs(decisions): spec·standards를 최종 상태로, ADR은 변경 이유 기록
- Feature: N/A
- 목적: ADR이 쌓여도 spec·standards만 읽으면 현재 규칙을 알 수 있게 한다(사용자 결정, ADR-008).
- 변경: AGENTS.md·docs/README.md 우선순위 문구 변경. ADR-001~007을 spec·standards와 대조해 빠진 두 건 반영: spec 03 검증(class-validator)·테스트(Vitest+SWC), PRD "MVP 제외"에 버킷 중첩·비교/결정 화면. ADR-008 추가.
- 영향: 문서만. 이후 결정 변경 PR은 spec·standards 본문도 함께 고친다.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | chore(claude): .env 읽기·--no-verify를 permissions.deny로 차단
- Feature: N/A
- 목적: AGENTS에 문장으로만 있던 금지(비밀 파일 읽기, hook 우회)를 Claude Code 설정으로 실행 단계에서 막는다. 토큰·보안 강의 내용 중 과하지 않은 것만 적용(사용자 결정). sandbox·AGENTS 축약·HISTORY 읽기 hook·서브에이전트·headless는 보류.
- 변경: `.claude/settings.json` `permissions.deny`에 `Read(./.env)`, `Read(./apps/*/.env.local)`, `git commit --no-verify`/`-n`, `git push --no-verify`. `BRANCHING.md` 9번(HISTORY 충돌 시 rebase + `--force-with-lease`). AI-LOG 3건.
- 영향: Claude Code 세션만. 사람의 터미널 작업과 CI는 그대로. deny는 등록한 형태만 막으므로 최종 기준은 계속 CI다.
- 검증: 설정 적용 후 같은 세션에서 Read(.env) 거부, Bash `head -c 0 .env` 거부, 스테이징 없는 상태의 `git commit --no-verify` 거부 확인. Prettier 검사. 코드 변경 없어 verify는 pre-commit 범위만.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | fix(harness): 세팅 검증에서 찾은 게이트 공백 7건
- Feature: N/A
- 목적: 기능 구현 전 세팅 검증(사용자 요청)에서 찾은 공백을 게이트로 막는다. 결과: `docs/qa/TEST-REPORT.md`.
- 변경: web 경계 lint를 `no-restricted-imports` 문자열 패턴에서 `import/no-restricted-paths`(해석된 경로, basePath 고정, feature 목록은 `src/features` 폴더에서 생성)로 교체 — G1·G2·G3 차단, G7 오탐 해소. `eslint-plugin-import` 2.32.0을 web 직접 devDependency로 추가(이미 eslint-config-next 경유 설치, 사용자 승인). pre-commit이 HISTORY 검사 실패 이유를 출력(G4). `ci-scope.sh` 전체 검사 조건에 `prisma.config.ts`·`.nvmrc` 추가(G5·G6). `FRONTEND.md` Boundaries 갱신, AI-LOG 3건.
- 영향: 같은 feature 안의 `@/features/<self>/...` 별칭 import는 더 이상 막히지 않는다(AGENTS 규칙은 "다른 기능"만 금지). 에디터 ESLint는 새 feature 폴더를 만든 뒤 재시작해야 경계가 반영된다(CLI·hook·CI는 매번 새로 읽음). `.nvmrc`·`prisma.config.ts` 변경 PR은 CI 전체 검사로 시간이 늘어난다.
- 검증: 경계 fixture 15개(차단 7·통과 8) 기대대로, apps/web/src cwd에서 basePath 효과 확인(없음 0건/있음 3건). G4 메시지 출력 확인. scratch worktree에서 G5·G6 전체 검사, web만·docs만 회귀 확인. `npm run verify` PASS(8/8, web lint 포함 3개 새로 실행). `npm run build` PASS(3/3). 통합 테스트는 로컬 미실행(api 코드 변경 없음, CI에서 실행).
- 주의/롤백: revert로 롤백. 롤백하면 G1~G7이 다시 열린다.

## 2026-10-30 | chore(github): PR 템플릿 추가와 레포 설명 통일
- Feature: N/A
- 목적: PR 본문 형식을 고정해 설계 근거와 실측 결과가 PR마다 남게 한다. GitHub 레포 설명이 README·스펙의 서비스 정의와 달라 README 기준으로 맞춘다(사용자 결정).
- 변경: `.github/pull_request_template.md`(목적·변경 요약·설계 결정과 근거·검증·측정·위험/롤백). `BRANCHING.md` PR 본문 항목을 템플릿과 맞춤. GitHub 레포 설명을 README 첫 문장으로 변경(git 밖 설정).
- 영향: 이후 웹에서 여는 PR 본문 기본값. 코드·CI 영향 없음.
- 검증: Prettier 검사(pre-commit). 레포 설명은 `gh repo view`로 확인. 이 PR 본문을 템플릿 형식으로 작성(`gh pr create`는 템플릿을 자동 적용하지 않으므로 웹 PR 화면의 기본값 적용은 미확인).
- 주의/롤백: revert로 롤백. 레포 설명은 `gh repo edit --description`으로 되돌린다.

## 2026-10-29 | docs(learning): 초기 세팅 학습 노트 01
- Feature: N/A
- 목적: 사용자 요청 — 기본 세팅 완료 시점의 구조를 파트별(공통·web·api·api-client·게이트·Git·의존성·배포·AI 하네스)로 학습용 정리.
- 변경: `docs/learning/01-initial-setup.md`(스냅샷 문서, dev f8065b6 기준). 규칙은 복사하지 않고 원본 문서·코드로 링크. `docs/README.md`에 학습 노트 목록 추가.
- 영향: 문서만. 낡으면 새 노트를 추가하고 기존 노트는 고치지 않는다.
- 검증: 문서의 상대 링크 전부 존재 확인(스크립트). PR #14 merge 후 Dependabot undici 경보 8건 모두 fixed 확인(API). pre-commit만 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(deps): Dependabot에서 @types/node·TypeScript·ESLint 메이저 제외
- Feature: N/A
- 목적: #5(@types/node 26)·#4(TypeScript 7)·#6(ESLint 10)은 보류·불일치로 닫는다. 같은 PR이 매주 다시 열리지 않게 한다(사용자 결정).
- 변경: `dependabot.yml` npm `ignore`에 세 패키지의 semver-major.
- 영향: 세 패키지의 minor·patch는 계속 제안된다. 메이저는 별도 검토 작업으로 올린다(TypeScript 7은 ESLint 플러그인 호환, ESLint 10은 eslint-config-next 지원 확인 필요).
- 검증: Prettier 검사. Dependabot 반영은 다음 주간 실행에서 확인(미실행).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(deps): jsdom 30, @types/node 24(Node 버전 정합), React 19.3.1 단일화
- Feature: N/A
- 목적: Dependabot #7(jsdom) 반영. #5(@types/node 26)는 고정 Node 24와 맞지 않아 닫고, 기존 web의 `^20`도 Node 24와 어긋나 있어 24로 맞춘다(사용자 결정). 직전 커밋의 React 19.3.0이 peer 해결로 두 벌 설치되는 문제를 고친다.
- 변경: web jsdom 28.1.0→30.1.2(요구 Node `^24.15.0` 충족), web @types/node `^20`→24.19.2, api `^24.19.2`→24.19.2(정확한 버전). react·react-dom 19.3.0→19.3.1(web·api-client, 공개 15일) — lock의 react 계열 항목을 지우고 재설치해 루트 한 벌만 남김. AI-LOG 2건.
- 영향: web·api-client·테스트 환경. 런타임 React 사본 1개.
- 검증: lock에 react·react-dom 19.3.1 루트 1벌만 존재 확인. `npm run verify` PASS(8/8, format·openapi:check 포함). `npm run build` PASS(3/3). 통합 테스트는 로컬 미실행(api 코드 변경 없음, CI에서 실행).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(deps): minor·patch 7개(turbo 2.11, React 19.3, testing-library)
- Feature: N/A
- 목적: Dependabot #3 반영.
- 변경: turbo 2.9.18→2.11.8, react·react-dom 19.2.4→19.3.0(web·api-client), @types/react 19.3.0, @types/react-dom 19.3.0, @testing-library/react 16.3.3, @testing-library/user-event 14.6.8. 이번에 올린 패키지는 범위(`^2`, `^19`, `^16.3.2` 등)를 정확한 버전으로 고정(의존성 정책).
- 영향: web·api-client·빌드 도구. Next 16.4.3의 peer `react ^19.0.0` 충족. 모든 버전 공개 16~63일.
- 검증: 버전별 공개일 npm 조회, `npm ls` invalid·UNMET 없음. verify·build는 이 브랜치 마지막 커밋에서 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(ci): actions/checkout·setup-node v4 → v7
- Feature: N/A
- 목적: Dependabot #1·#2 반영(한 브랜치로 모아 HISTORY 충돌·반복 CI를 피한다, 사용자 결정).
- 변경: `ci.yml`의 `actions/checkout@v7`, `actions/setup-node@v7`.
- 영향: CI만. checkout v7의 깨지는 변경은 `pull_request_target`·`workflow_run`에서 fork PR 체크아웃 차단 — 이 저장소는 사용하지 않는다. setup-node v7은 ESM 전환·캐시 출력 추가.
- 검증: 릴리스 노트(v5~v7) 확인. 실제 동작은 이 브랜치 PR의 CI로 확인.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | fix(deps): undici 7.29.1 취약점 해소(orval 경유, 범위 지정 override)
- Feature: N/A
- 목적: Dependabot 경보 5건(undici 7.x < 7.30.1, high 4·medium 1). 취약 버전은 orval 8.43.0 → `@scalar/json-magic@0.15.7` 경로에만 있다(개발용 코드 생성 도구, 서버 미포함). #12는 orval을 4일 된 8.45.0(`^` 범위)으로 올려 14일·정확한 버전 규칙에 어긋나므로 닫는다(사용자 결정).
- 변경: 루트 `overrides`에 `"@scalar/json-magic@0.15.7": { "undici": "7.30.1" }`(7.30.1은 공개 14일). lock에서 해당 경로 7.29.1 항목 제거 후 재설치.
- 영향: dev 의존성만. orval 8.43.0 유지. `@scalar/json-magic@0.17.0`의 undici 8.12.3(패치 버전 8.12.2 이상)은 그대로.
- 검증: `npm ls undici --all`에서 7.29.1 사라짐, 0.15.7 경로 7.30.1, 8.12.3 경로 불변 확인. 첫 시도(`orval > @scalar/json-magic` 중첩 override)는 8.12.3 경로까지 7.30.1로 끌어내려 invalid가 되어 버전 지정 키로 바꿈. verify·openapi:check는 이 브랜치 마지막 커밋에서 실행. 승격 PR #13(dev→stg) — PR 경로·HISTORY 보존 검사·verify 통과, stg merge 방식 merge commit만 허용 API로 확인, 사용자 merge(974e1c1).
- 주의/롤백: orval을 올릴 때 이 override가 불필요해지면 제거한다. revert로 롤백.

## 2026-10-29 | chore(claude): 커밋·PR의 AI 작성자 표시 끄기
- Feature: N/A
- 목적: 사용자 결정 — 커밋·PR에 Claude 공동 작성자·"Generated with" 표시를 남기지 않는다. AI 하네스(AGENTS·게이트·AI-LOG) 자체는 포트폴리오 사례로 유지하고, 과거 커밋 이력은 다시 쓰지 않는다.
- 변경: `.claude/settings.json`에 `attribution.commit`·`attribution.pr` 빈 값. `/finish` 커밋 메시지 초안에서 attribution 항목 제거(표시를 넣지 않는다고 명시).
- 영향: Claude Code가 만드는 커밋·PR에 작성자 표시가 붙지 않는다. 코드·CI 영향 없음.
- 검증: `jq -e .attribution .claude/settings.json`로 JSON·값 확인. 실제 커밋에 표시가 붙지 않는지는 이 커밋 메시지로 확인. PR #9 merge(231e3b2) 확인 — squash 메시지에 기존 커밋의 공동 작성자 줄이 남았고 과거 이력 유지 결정에 따라 그대로 둠.
- 주의/롤백: 설정은 Claude Code 세션 재시작 후 반영될 수 있다. revert로 롤백.

## 2026-10-29 | docs(git): 브랜치 전략 PR 검증 결과, 검증용 PR 분리 규칙
- Feature: N/A
- 목적: 직전 항목(ADR-007)에서 PR로 미룬 검증 결과를 기록하고, 검증 중 생긴 AI 실수를 규칙으로 막는다.
- 변경: BRANCHING.md AI 에이전트 절에 "검증용 PR은 별도 브랜치·커밋" 1줄. AI-LOG 1건.
- 영향: 문서만. 이 커밋으로 PR #9의 필수 체크 막힘이 풀린다(새 커밋에는 #9 CI 결과만 붙음).
- 검증: PR #9(작업 브랜치→dev) CI `verify` 통과, 처음 merge 상태 CLEAN. 임시 PR #10(작업 브랜치→stg)은 "chore/branch-strategy → stg 는 허용되지 않는 경로다(ADR-007)"로 실패·BLOCKED 확인 후 닫음. GitHub API로 dev 규칙 deletion·non_fast_forward·pull_request·required_status_checks 활성 확인. #10이 같은 커밋을 써서 #9도 BLOCKED가 됐고, #9 CI 재실행(통과)으로는 풀리지 않음을 확인. dev→stg 승격 PR은 #9 merge 후 미실행(대기).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(git): dev·stg·prod 브랜치 전략과 PR 필수화, 보안 설정 (ADR-007)
- Feature: N/A
- 목적: main 직접 push 구조라 CI 실패 코드도 들어갔다. 실무 흐름(작업 브랜치→dev→stg→prod)을 프로젝트 규칙으로 고정하고 CI 통과를 merge 조건으로 강제한다(사용자 결정). public 저장소인데 비밀값 감지가 꺼져 있었다.
- 변경: 규칙 `docs/standards/BRANCHING.md`, ADR-007. `ci.yml` 트리거를 dev·stg·prod 대상 PR·주간·수동으로(push 재실행 제거), PR 경로 검사 단계 추가. pre-commit이 보호 브랜치(dev·stg·prod·main) 커밋 차단. AGENTS(작업 브랜치·사용자 merge), `/finish`(push·PR 별도 승인, merge 안 함), HARNESS-PLAN·QUALITY·SETUP. GitHub: main→dev 이름 변경(기본 브랜치), stg·prod 생성, ruleset 2개(dev: squash만 / stg·prod: merge commit만, 공통 PR 필수·`verify` 필수·강제 push·삭제 금지·승인 미요구·우회 없음). Secret scanning·push protection·취약점 알림·Dependabot 보안 업데이트 켬.
- 영향: 보호 브랜치 직접 push 불가, 모든 변경은 PR. CI는 PR당 1회. 서버 비용 없음(환경은 D-12).
- 검증: pre-commit을 로컬 `stg` 브랜치에서 실행해 차단(exit 1), 작업 브랜치에서는 통과 경로 확인. GitHub API로 기본 브랜치 dev, ruleset 2개 생성, 보안 설정 enabled 응답 확인. 이 PR의 CI 필수 체크·승격 PR·잘못된 경로 PR 결과는 PR에서 확인 후 다음 항목에 기록.
- 주의/롤백: 로컬 클론은 `git branch -m main dev && git branch -u origin/dev dev` 필요. 롤백은 ruleset 삭제, dev→main 이름 변경, `ci.yml` 트리거 복원.

## 2026-10-29 | docs(agents): 비용이 필수 요소를 줄이는 근거가 아님을 명시
- Feature: N/A
- 목적: 사용자 지시 반영 — 비용 최적화가 보안·정확성 같은 필수 요소까지 줄이는 근거로 읽히지 않게 한다.
- 변경: AGENTS.md "지시 범위와 목표"에 1줄 추가 — 필수 요소(보안, 데이터 무결성, 정확성, 장애 대응용 로그·백업·관측, 접근성)는 빼거나 줄이지 않고 더 효율적인 방법을 찾으며, 애매하면 사용자에게 묻는다.
- 영향: 문서만.
- 검증: 문서 전용, pre-commit만 실행. 직전 커밋에 amend하려 했으나 HISTORY 보존 검사가 기존 항목 수정을 막아 별도 커밋으로 남김(검사 의도대로 동작).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | docs(agents): 미지시 작업 사전 확인, 올바른 코드·성능 우선, 서버 자산 비용 영향 명시
- Feature: N/A
- 목적: 사용자 지시 반영 — 지시하지 않은 작업은 크기와 관계없이 먼저 묻고, 구현 완료보다 올바른 코드·성능을 우선하며, 서버 자산 전체를 비용으로 고려한다. 기존 지침은 큰 변경만 승인 대상이었고 비용은 캐시 위주로만 적혀 있었다.
- 변경: AGENTS.md "지시 범위와 목표" 3줄. TASK-TEMPLATE에 "비용 영향" 항목 분리(`/task` 계획 양식). 폴더 구조는 검토 후 현행(`apps/`·`packages/`) 유지로 결정 — 변경 없음.
- 영향: 문서만.
- 검증: 문서 전용, pre-commit만 실행. 직전 항목(ci: 바뀐 패키지만 검사)의 GitHub 실행 결과 보충 — main push(78e3431) 전체 검사 PASS, web만 바꾼 임시 PR #8에서 web만 검사·DB 통합 건너뜀 PASS(1분 15초), PR은 merge 없이 닫고 브랜치 삭제.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | ci: 바뀐 패키지만 검사(turbo --affected), 주 1회·수동 전체 검사
- Feature: N/A
- 목적: web·api(이후 모바일)가 한 저장소에 있어 CI가 매 push마다 전체를 검사했다. 로컬(pre-commit=staged 파일, verify=turbo 캐시)은 이미 변경 범위만 돌고 있었다.
- 변경: `scripts/ci-scope.sh`(비교 기준·전체 검사 조건 판단, turbo 인자와 api 포함 여부 출력). `ci.yml`에 범위 단계, verify·통합·build에 `--affected`, DB 마이그레이션·통합 테스트는 api 범위일 때만, `schedule`(월 03:00 KST)·`workflow_dispatch` 전체 검사. HARNESS-PLAN CI 정책, QUALITY 표.
- 영향: CI만. web만 바꾸면 api lint·typecheck·test·build·DB 통합을 건너뛴다. format:check·openapi:check는 매번 전체.
- 검증: turbo 2.9.18에서 변경별 affected 확인 — web 파일→web, api 파일→api, api-client→api-client·web, turbo.json→전체, docs·prisma→없음(그래서 prisma는 전체 검사로 처리). 스크립트를 기준 없음·0 커밋·문서만·CI 변경 커밋으로 실행해 기대 출력 확인. web만 바꾼 상태의 build dry-run에 api 제외, 범위가 비었을 때 turbo exit 0 확인. GitHub Actions 실행 결과는 push 후 확인.
- 주의/롤백: turbo는 api 변경을 web에 연결하지 않는다(생성 코드 경유) — openapi:check가 매번 전체로 이 연결을 검사한다. 놓친 경우는 주간 전체 검사로 잡는다. revert로 롤백.

## 2026-10-28 | docs(readme): 현재 상태를 기본 세팅 완료 기준으로 갱신
- Feature: N/A
- 목적: README "현재 상태"가 초기 스켈레톤 기준(web 빈 페이지·테스트 1개, packages 없음)에 머물러 실제와 달랐다.
- 변경: 단계(기본 세팅 완료, 보류 항목 D-08·D-09·D-12), web Provider·API 주소, api ADR-006, `packages/api-client` 항목 추가.
- 영향: 문서만.
- 검증: 저장소 파일(`apps/`, `packages/`, ADR 목록)과 대조. pre-commit만 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-28 | docs(agents): Anti-Laziness·Anti-Hallucination 규칙, 현재 단계(기본 세팅) 명시, 배포·모바일·디자인 보류
- Feature: N/A
- 목적: 사용자 지시 반영 — 근거 확인·완전 구현·실제 검증·최종 보고 규칙을 AI 공통 규약에 추가하고, 지금은 기본 세팅 단계임을 AI가 읽는 문서에 고정한다.
- 변경: AGENTS.md에 "Anti-Laziness & Anti-Hallucination" 절(사용자 제공 원문)과 현재 단계 문단 추가. `/finish` 최종 보고 항목을 Final Report 형식에 맞춤. OPEN-QUESTIONS D-08(모바일 구현 단계에서)·D-09(사용자가 직접 세팅) 보류 표시, D-12(배포 호스팅·CD, 맨 마지막) 추가. HARNESS-PLAN CI 계획에서 배포를 D-12 이후로.
- 영향: 문서·스킬 정의만. 기존 CI(검사)는 유지.
- 검증: 문서 전용, pre-commit만 실행.
- 주의/롤백: "현재 단계" 문단은 기능 구현을 시작할 때 갱신해야 한다. revert로 롤백.

## 2026-10-28 | feat(web): TanStack Query Provider·기본 정책, API 주소 설정
- Feature: N/A
- 목적: 첫 화면 기능이 바로 생성된 api-client 훅을 쓸 수 있게 하고, 요청 정책을 한곳에서 고정한다(FRONTEND.md Network / state).
- 변경: `app/query-client.ts`(refetchOnWindowFocus false, 쿼리 retry 1, 뮤테이션 retry 0, 캐시 수치는 기본값), `app/providers.tsx`(컴포넌트 수명당 QueryClient, `configureApiClient`, 운영 빌드에서 `NEXT_PUBLIC_API_BASE_URL` 없으면 실패), layout에 Providers. web 의존성 `@tanstack/react-query` 5.104.3·`@keepio/api-client`, `transpilePackages`. `apps/web/.env.example`, CI에 검증용 API 주소, SETUP 설치 단계·문제 해결 1행, FRONTEND 정책 1줄.
- 영향: 화면 변화 없음. web 운영 빌드에 `NEXT_PUBLIC_API_BASE_URL` 필요.
- 검증: web 테스트 2개 PASS(Providers 기본 정책 포함). turbo로 환경 변수만 넘긴 빌드 PASS, 값 없이 빌드 시 의도대로 실패 확인. `npm run build` PASS(3/3), `npm run verify` PASS(8/8).
- 주의/롤백: staleTime 등 캐시 수치는 측정 후 결정. revert로 롤백.

## 2026-10-28 | feat(api): 공통 오류 응답·요청 ID·접근 로그·환경 변수 검증 (ADR-006)
- Feature: N/A
- 목적: 기능 구현 전에 모든 API가 공유할 오류 계약·관측성·설정 검증을 고정한다.
- 변경: `common/api-error.ts`(`ApiErrorResponse`, `ApiException`), `common/api-exception.filter.ts`(전역 필터), `common/request-context.ts`(x-request-id 검증·생성, AsyncLocalStorage, 쿼리 제외 접근 로그), `config/env.ts`(`loadEnv`). main은 `loadEnv`·운영 JSON 로거, PrismaService는 `loadEnv` 사용. `/health` DB down은 예외 대신 503 상태로 같은 본문. OpenAPI에 `ApiErrorResponse` 추가 → api-client 재생성. `@types/express` 5.0.6 추가. ADR-006, BACKEND 규칙 2줄, `.env.example` NODE_ENV, FEAT-001 오류 형태 참조, AI-LOG 1건.
- 영향: 모든 오류 응답 본문 형태 변경(소비자 없음). `/health` 응답 형태·상태 코드 유지.
- 검증: api 단위 12개 PASS(env 4, 오류·요청 ID 5, health 3), 통합 2개 PASS(실제 PG). 404 쿼리 미노출 테스트가 수정 전 코드에서 실패함을 확인. 운영 모드 실제 기동 — JSON 로그, 접근 로그 쿼리 제외, `/health` 200, 잘못된 DATABASE_URL로 exit 1·비밀값 미출력. `npm run verify` PASS(8/8).
- 주의/롤백: 로그 수집 서비스는 미정(배포 단계). `setup-app.ts`에서 필터·미들웨어 제거로 롤백.

## 2026-10-28 | chore(deps): Dependabot 주간 업데이트, 공개 14일 경과 릴리스만
- Feature: N/A
- 목적: 수동으로 지키던 "공개 직후 버전 회피" 원칙을 자동화하고, 보안 패치가 방치되지 않게 한다.
- 변경: `.github/dependabot.yml`(npm 주간·minor/patch 묶음·PR 최대 5개, github-actions 월간, 둘 다 `cooldown` 14일). standards/HISTORY에 Dependabot PR도 HISTORY 항목 필수(리뷰어가 추가) 명시, OPERATIONS에 의존성 정책 1줄.
- 영향: push 후 GitHub이 매주 PR을 연다. 머지 전 CI와 HISTORY 항목이 필요하다.
- 검증: Prettier 검사. Dependabot 설정 유효성은 push 후 GitHub의 Dependabot 탭에서 확인 필요(미실행).
- 주의/롤백: Dependabot이 PR 브랜치에 사람이 커밋하면 자동 rebase를 멈춘다(충돌 시 `@dependabot recreate`). 파일 삭제로 롤백.

## 2026-10-28 | docs(harness): HARNESS-PLAN을 현재 상태로 갱신, blame 제외 커밋 등록
- Feature: N/A
- 목적: 계획 단계에 머물러 있던 하네스 문서를 실제 구현과 남은 일 기준으로 맞추고, 일괄 포맷 커밋이 `git blame`을 가리지 않게 한다.
- 변경: HARNESS-PLAN 단계별 상태 표·현재 CI 정책(브랜치 보호 미적용 명시). `.git-blame-ignore-revs`(f99f5f3), `prepare`에서 `blame.ignoreRevsFile` 설정.
- 영향: 문서·로컬 git 설정만.
- 검증: `npm run prepare` 후 `git config blame.ignoreRevsFile` 값 확인. pre-commit 실행.
- 주의/롤백: GitHub 웹 blame은 저장소 루트의 같은 파일을 자동 인식한다. revert 후 `git config --unset blame.ignoreRevsFile`.

## 2026-10-28 | feat(api-client): OpenAPI 내보내기, Orval 클라이언트 생성, 명세 불일치 게이트 (Phase 0-2)
- Feature: N/A
- 목적: 웹이 API 응답을 추측하지 않고 생성된 타입·훅만 쓰게 하고, 코드와 명세가 어긋나면 verify에서 막는다(ADR-005).
- 변경: api `createOpenApiDocument` 분리, `openapi-export.ts`(Nest preview 모드, DB 불필요). `packages/api-client`(Orval 8.43.0 react-query+fetch, mutator `apiFetch`, 생성물 커밋, typecheck). 루트 `openapi:generate`(turbo로 api 빌드 → 내보내기 → 생성 → prettier), `openapi:check`(`scripts/check-openapi.sh`, 해시 비교) → verify에 포함. ADR-005, FRONTEND(Next 16.4.3 표기 정정, 클라이언트 규칙)·BACKEND·SETUP·README 갱신, ADR-003에 "위반 예제는 검증 대상 게이트까지 도달" 원칙 추가, AI-LOG 2건.
- 영향: verify가 api 빌드를 포함해 몇 초 늘어남. 웹 소비 코드·QueryClientProvider는 아직 없음(첫 소비 기능에서 정책과 함께 추가). 새 의존성 orval 8.43.0, @tanstack/react-query 5.104.3(peer) — 둘 다 공개 약 2주 경과 버전으로 고정.
- 검증: `npm run verify` PASS(8/8), `npm run build` PASS(3/3). `HealthResponse`에 선택 속성 추가 후 재생성 없이 `openapi:check` exit 1, 복원 후 exit 0. Prisma 생성 코드를 지운 깨끗한 상태에서 `openapi:check` 통과(turbo가 db:generate 선행). 2회 연속 생성 결과 동일(결정적).
- 주의/롤백: Node는 nvm v24.22.1 사용(셸 기본 v24.19.0은 engine-strict로 거부). 생성물 손수정 금지. revert로 롤백.

## 2026-10-28 | docs: D-01(삭제 URL 재저장 → 409 복구 안내)·D-11(임시 사용자 Guard) 결정 반영
- Feature: FEAT-001
- 목적: FEAT-001 구현을 막던 정책 두 가지를 사용자 결정으로 확정한다.
- 변경: OPEN-QUESTIONS D-01·D-11 결정 기록, PRD 비즈니스 규칙 1줄, spec 04 URL 정책 문장 확정, FEAT-001 AC-07 확정·미확정 목록 축소(추적 파라미터·길이 상한, 신규/기존 응답 구분 2건 남음).
- 영향: 문서만. 409 응답은 FEAT-001에서 새 계약으로 추가된다.
- 검증: 문서 전용, pre-commit만 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-28 | docs: FEAT-001 링크 저장 명세 초안, D-10 백오피스·D-11 임시 사용자 식별 등록
- Feature: FEAT-001
- 목적: 첫 도메인 기능의 수용 기준과 미결정을 구현 전에 고정하고, 백오피스 논의를 결정 대기 목록에 남긴다.
- 변경: `docs/features/bookmark-save.md`(Draft, AC-01~07, 미확정 4건), features README 목록, OPEN-QUESTIONS에 D-10(백오피스 범위·시점)·D-11(인증 전 사용자 식별) 추가.
- 영향: 문서만. FEAT-001 구현은 D-01·D-11 결정과 승인 후.
- 검증: 문서 전용, pre-commit만 실행.
- 주의/롤백: 응답 형태·추적 파라미터 목록은 미확정으로 표시(추측 금지). revert로 롤백.

## 2026-10-28 | chore(skill): /task가 현재 git 상태와 기존 파일을 먼저 확인하도록 보강
- Feature: N/A
- 목적: 대화 기억에 의존해 이미 끝난 작업을 다시 계획하고 기존 파일을 덮어쓴 실수의 재발 방지.
- 변경: `.claude/skills/task/SKILL.md`에 0단계(git status·log, HISTORY 파일 직접 확인, 중복 작업이면 보고) 추가, 기존 경로는 읽고 계획·ADR/Feature 번호는 현재 파일 목록 기준 규칙 추가. AI-LOG에 사례 기록.
- 영향: 스킬 정의·문서만.
- 검증: pre-commit(HISTORY·포맷·관련 테스트) 실행. 코드 변경 없어 verify 미실행. 스킬 동작은 다음 `/task` 실행에서 확인 필요.
- 주의/롤백: 이 세션의 중복 ADR 커밋은 push 전이라 reset으로 제거(이력 없음). revert로 롤백.

## 2026-10-26 | fix(ci): postgres 서비스 healthcheck 인자 제거
- Feature: N/A
- 목적: 첫 CI 실행(run 40294677023)이 서비스 컨테이너 생성 단계에서 실패해 이후 단계가 전혀 실행되지 않았다.
- 변경: `--health-cmd 'pg_isready -U keepio'` → `--health-cmd pg_isready`. runner가 따옴표 안 공백을 나눠 `-U`를 docker 옵션으로 해석(`unknown shorthand flag: 'U'`, exit 125).
- 영향: CI 설정만. healthcheck는 접속 수락 여부만 확인(인증 사용자 지정 불필요).
- 검증: 로컬에서 같은 옵션으로 postgres:16 컨테이너 실행해 `healthy` 도달 확인. GitHub Actions 재실행 결과는 push 후 확인(미실행).
- 주의/롤백: 로컬 CI 재현은 GitHub 서비스 컨테이너 단계를 흉내 내지 못한다. revert로 롤백.

## 2026-10-26 | chore(test): 실제 PostgreSQL 통합 테스트와 CI 활성화
- Feature: N/A
- 목적: Phase 0 "NestJS + PostgreSQL 프로젝트 구성"의 3단계. 백엔드 제약을 실제 DB로 검증하는 경로와, 로컬 hook을 우회해도 막히는 최종 게이트(CI)를 갖춘다.
- 변경: api `vitest.int.config.mts`(`*.int.test.ts`만, 파일 순차 실행)·`vitest.int.setup.ts`(`DATABASE_URL_TEST` 필수, DB 이름 `_test` 아니면 거부), `health.int.test.ts`(실제 DB /health 200, baseline 적용 확인). 루트 `test:integration`(turbo, 캐시 없음)·`db:migrate:test`(`PRISMA_TARGET=test`). turbo `globalPassThroughEnv`(DATABASE_URL·DATABASE_URL_TEST·DB_POOL_MAX·PRISMA_TARGET). `prisma.config.ts`는 URL이 없어도 generate 진행. `ci.example.yml` → `ci.yml`(main push·PR, 읽기 권한, 동시 실행 취소, 20분 제한, PR HISTORY 검사, npm ci → verify → db:migrate:test → test:integration → build). SETUP·README 반영.
- 영향: push 시 GitHub Actions 실행 시작(아직 push 안 함). 단위 테스트·verify는 DB 없이 동작.
- 검증: 로컬 `test:integration` 2 passed, 단위 3 passed(분리 확인). dev DB를 `DATABASE_URL_TEST`로 지정하면 setup이 거부. git 추적 파일만 복사한 깨끗한 폴더에서 CI 단계 재현 — `npm ci`·`verify`·`db:migrate:test`·`test:integration`(2 passed)·`build` PASS(Node 24.22.1, 로컬 PG 16 keepio_test). 재현 중 format 누락 3파일과 turbo 환경 변수 차단을 발견해 수정. 환경 변수 없이 verify PASS, migrate는 "Connection url is empty", 통합 테스트는 "DATABASE_URL_TEST is not set"으로 실패 확인. `check-history.py origin/main` OK. GitHub Actions 실제 실행은 미실행(push 전).
- 주의/롤백: CI의 postgres 서비스·Ubuntu 환경은 로컬 재현과 다를 수 있어 첫 실행 결과 확인 필요. 새 DB 환경 변수는 `globalPassThroughEnv`에 추가해야 turbo 작업에 전달된다. revert로 롤백(CI 비활성화).

## 2026-10-26 | chore(db): Prisma 7 + PostgreSQL 16 로컬 DB, /health DB 상태, 개발 환경 문서
- Feature: N/A
- 목적: Phase 0 "NestJS + PostgreSQL 프로젝트 구성"의 2단계. api가 실제 DB에 연결되고, 처음 보는 사람도 설치·실행할 수 있게 한다.
- 변경: `docker-compose.yml`(postgres:16, keepio·keepio_test DB). 로컬 포트를 다른 프로젝트와 겹치지 않는 7710번대로 통일 — web 7710(`--port`), api 7711(기본값·`.env`), DB 127.0.0.1:7712, 루트 `prisma/`(빈 baseline 마이그레이션)·`prisma.config.ts`, `.env.example`. api `PrismaModule`(adapter-pg, `DB_POOL_MAX` 상한, 연결 timeout 5초, 종료 시 `$disconnect`), `/health`가 `SELECT 1`(2초 timeout)로 DB 확인 — up 200 / down 503. main.ts가 루트 `.env`를 있을 때만 로드. 루트 `db:*`·`dev:api`(turbo 경유) 스크립트, turbo `//#db:generate`를 api build·dev·typecheck·test 앞에 실행. 생성 코드는 git·Prettier·ESLint 제외. `docs/SETUP.md`(설치·버전·명령·문제 해결), README·docs/README 링크, ADR-004에 Prisma 결정 추가.
- 영향: `/health` 응답에 `db` 필드 추가(계약 신규, 소비자 없음). api 실행에 DB와 `.env` 필요. 새 의존성 prisma·@prisma/client·@prisma/adapter-pg 7.10.1(11일 경과).
- 검증: `npm run verify` PASS(7/7, 생성 코드 삭제 상태에서 시작해 generate 자동 실행 확인), `npm run build` PASS(3/3), `npm audit` 0건. 단위 테스트 3개(up 200, down 503, OpenAPI) PASS. 실제 기동 — DB up 200 `{"status":"ok","db":"up"}`, 컨테이너 정지 시 503 `{"status":"error","db":"down"}`, 재시작 후 200 자동 복구, SIGTERM 정상 종료. `prisma migrate deploy` dev·test DB 모두 적용, `db:status` up to date. `npm run dev:api`를 생성 코드·dist 없는 상태에서 실행해 /health 200. 포트 변경 후 `db:up`(7712)·`db:status` up to date, `dev:api` 7711 /health 200, `dev:web` 7710 200, CORS `Access-Control-Allow-Origin: http://localhost:7710` 확인. Prisma 엔진 install script 보류 상태에서 generate·migrate 동작 확인. 실제 DB 통합 테스트(`*.int.test.ts`)는 미실행(다음 커밋).
- 주의/롤백: `docker compose down -v`는 로컬 데이터 삭제. baseline 마이그레이션은 `SELECT 1`만 실행. Prisma 8은 RC 단계라 보류. revert 후 `docker compose down`으로 롤백.

## 2026-10-26 | chore(api): NestJS 12 앱 뼈대와 Vitest·ESLint 게이트
- Feature: N/A
- 목적: Phase 0 "NestJS + PostgreSQL 프로젝트 구성"의 1단계. DB 없이 실행·검증 가능한 API 기반을 만들고 기존 게이트(verify, 편집 훅, pre-commit)에 편입한다.
- 변경: `apps/api`(`@keepio/api`, ESM) — `GET /health`, `/docs` OpenAPI, 전역 ValidationPipe(whitelist·forbidNonWhitelisted·transform), `WEB_ORIGIN` 설정 시에만 CORS, `enableShutdownHooks`. Vitest + unplugin-swc, typescript-eslint + 테스트 규칙 + kebab-case 파일·폴더. 편집 훅·pre-commit을 web/api 공통으로 확장. turbo build outputs에 `dist/**`, `.gitignore`·`.prettierignore`에 dist. 루트 `overrides.multer 2.5.0`. ADR-004, AGENTS·README·QUALITY 반영.
- 영향: 신규 패키지만, web 동작 변화 없음. 공유 devDependency 호이스팅으로 typescript-eslint 8.61.1 → 8.71.2, eslint 9.39.4 → 9.39.5(web lint 통과 확인). 기본 포트 3001.
- 검증: `npm run verify` PASS(6/6), `npm run build` PASS(2/2), `npm audit` 0건. api 테스트 2개(health 200, OpenAPI에 /health 포함) PASS. `nest build` 후 기동해 `/health` 200 `{"status":"ok"}`, `/docs` 200, 미존재 경로 404 확인. 편집 훅 pipe-test — api 파일명 위반·`it.only` exit 2, 정상 파일 exit 0. 새 의존성은 배포 7일 이상 버전으로 선택(예외: 보안 수정 multer 2.5.0, 4일).
- 주의/롤백: Nest 12.2.0이 multer 2.4.0(GHSA-q7qp-rjg7-q26m)을 고정해 override 사용, Nest 업데이트 시 제거 검토. `@swc/core` postinstall 보류 상태로 동작 확인. DB·Prisma·통합 테스트·CI 활성화는 다음 커밋(OrbStack 설치 필요). revert로 롤백.

## 2026-10-26 | fix(security): Node 24.22.1 고정, next 16.4.3 및 의존성 취약점 해소
- Feature: N/A
- 목적: apps/api 착수 전 런타임·의존성 보안 기준선을 맞춘다. 2026-10-21 Node.js 보안 릴리스(CVE-2026-111497 Brotli 디코더 OOB write로 RCE, TLS 호스트명 검증·dns NUL 처리 등 10건)가 로컬 v24.19.0에 해당했고, `npm audit`에서 next critical 포함 15건이 나왔다.
- 변경: `.nvmrc`(24.22.1), 루트 `engines.node >=24.22.1 <25`, `.npmrc` `engine-strict=true`. web `next`·`eslint-config-next` 16.2.9 → 16.4.3(exact), `npm audit fix`(--force 없음, major 변경 없음). CI 예시는 `node-version-file: .nvmrc`. 편집 훅 Prettier에 저장소 기준 상대경로를 넘기도록 수정.
- 영향: 웹 런타임 마이너 업그레이드. 이 저장소에서 Node 24.22.1 미만이면 `npm install/ci`가 EBADENGINE으로 실패한다(의도). 회사 등 다른 프로젝트는 nvm으로 별도 버전 유지.
- 검증: `npm audit` 0건. `npm run verify` PASS(3/3), `npm run build` PASS(Node 24.22.1). `npm ci --dry-run`이 24.19.0에서 EBADENGINE 차단, 24.22.1에서 통과 확인. Shai-Hulud/ChainDrop(keyv·flat-cache 등) Wiz IOC 목록 446개와 lockfile 대조 결과 악성 버전 0건, 공개된 파일 IOC(`.claude/setup.mjs`, `.vscode/setup.mjs`, `Math_Symbol.js` 등)·전역 Claude 훅 없음. 훅 수정 전 HISTORY 편집 시 Prettier가 기존 기록을 재포맷해 `check-history.py`가 차단, 수정 후 같은 편집은 추가분만 남음을 확인.
- 주의/롤백: `packageManager`가 `npm@10.9.0`인데 실제는 11.19.1이라 Corepack 사용 시 npm 10(allow-scripts 정책 없음)이 쓰일 수 있다(미조치, AI-LOG 기록). fsevents·unrs-resolver install script는 계속 보류 상태. revert 후 `npm ci`로 롤백.

## 2026-10-26 | chore(test): 테스트 실행 시점·작성 규칙과 토큰 절약 게이트
- Feature: N/A
- 목적: 언제 어떤 테스트를 돌릴지와 작성 규칙을 정하고, AI 컨텍스트에 들어가는 검증 출력을 최소화한다.
- 변경: QUALITY.md에 실행 시점 표·토큰 원칙·작성 규칙 추가. web `test:related`(vitest related, dot reporter, 실패 로그만). verify에 turbo `--output-logs=errors-only`. pre-commit에 staged 관련 테스트 추가, 통과 시 무출력·실패 시 마지막 40줄. `@vitest/eslint-plugin` ~1.5.4로 `.only`/`.skip`/assertion 없는 테스트/중복 제목 금지. AGENTS·FEATURE-TEMPLATE·/finish에 반영. Stop 훅은 토큰 비용 때문에 도입하지 않음.
- 영향: 개발 도구·문서만.
- 검증: probe 테스트로 lint 3건(.only, .skip, expect 없음) error 확인. 실패 테스트를 stage한 커밋이 pre-commit에서 차단(약 1.3초), 통과 시 pre-commit 출력 0바이트 확인 후 probe 삭제. `npm run verify` PASS(3/3).
- 주의/롤백: 플러그인 1.6.x는 TS6 필요(AI-LOG 기록). 관련 테스트가 30초를 넘으면 pre-push로 이동. revert로 롤백.

## 2026-10-26 | docs: AI 협업 하네스 결정(ADR-003)·AI-LOG·포트폴리오 사례 6 추가
- Feature: N/A
- 목적: 오늘 구축한 하네스의 결정 이유와 실제 사례를 기억이 생생할 때 남겨, 출시 품질 근거이자 포트폴리오 증거로 쓴다.
- 변경: ADR-003(게이트 계층, 사람/AI 역할 분담), `docs/qa/AI-LOG.md`(오늘 실제 발생한 5건 + 기능별 지표 표), spec 05 포트폴리오 핵심 사례 6 추가, docs/README·AGENTS에 AI-LOG 기록 규칙, `/finish`에 AI-LOG 기록 단계 추가.
- 영향: 문서·스킬 정의만. spec 05는 사례 목록 1줄 추가(기존 내용 변경 없음).
- 검증: `npm run verify` PASS(3/3). AI-LOG 항목은 이 세션의 HISTORY 기록과 대조해 실제 발생한 것만 기재.
- 주의/롤백: AI-LOG는 기록이 쌓여야 가치가 있다. 지표는 측정값만 기재. revert로 롤백.

## 2026-10-26 | chore: 작업 프로토콜 슬래시 명령 /task·/feature·/finish
- Feature: N/A
- 목적: AGENTS.md의 "계획 → 승인 → 구현 → 검증 → HISTORY → 커밋" 흐름을 매번 지시하지 않고 명령 하나로 재현한다.
- 변경: `.claude/skills/{task,feature,finish}/SKILL.md` 추가(사용자 호출 전용, 단계별 허용 도구 제한: /task 읽기 전용, /feature는 docs/features만 수정, /finish는 verify·build·docs 수정만 자동 허용하고 git add/commit은 확인 필요). AGENTS·README에 흐름 명시.
- 영향: 개발 도구·문서만.
- 검증: `npm run verify` PASS(3/3). 이 커밋은 /finish 절차(범위 확인 → verify → HISTORY → 커밋)를 수동으로 따라 작성. 명령 자체의 실행은 미실행(새 세션에서 스킬 목록이 로드된 뒤 확인 필요).
- 주의/롤백: 명령 정의는 프롬프트라 결과가 매번 같지 않을 수 있다. 실제 사용에서 어긋난 점은 SKILL.md에 반영한다. revert로 롤백.

## 2026-10-26 | chore: Claude Code 편집 훅·권한 허용 목록·git pre-commit 연결
- Feature: N/A
- 목적: AI가 파일을 고치는 즉시 포맷·린트 피드백을 받고, 커밋 시 HISTORY·포맷 검사가 자동으로 돌게 해 문서 규칙 의존을 줄인다.
- 변경: `.claude/settings.json`(PostToolUse Edit|Write|MultiEdit 훅, verify/lint/typecheck/test/format/build·git 조회·check-history 허용), `.claude/hooks/post-edit.sh`(편집 파일 1개 Prettier, apps/web ts/tsx/mjs ESLint 위반 시 exit 2로 피드백), `.githooks/pre-commit`(check-history + staged Prettier 검사), 루트 `prepare`로 `core.hooksPath` 설정. AGENTS/QUALITY/README에 자동 게이트 명시.
- 영향: 개발 도구만. 런타임 코드 변경 없음. 클론 후 `npm install` 시 git hook 경로가 바뀐다.
- 검증: 훅 스크립트 pipe-test — 정상 파일 exit 0, 색상 리터럴 파일은 포맷 수정 + ESLint error로 exit 2, 저장소 밖 파일 무시. 세션 내 실제 Edit로 공백을 넣어 훅이 자동 복원(diff 0) 확인. HISTORY 없는 커밋이 pre-commit에서 차단됨을 확인. 포맷이 틀린 임시 파일을 stage한 커밋도 차단됨을 확인 후 제거. `npm run verify` PASS.
- 주의/롤백: 한글 경로에서 ESLint 절대경로가 "outside of base path"로 무시되는 문제가 있어 apps/web 기준 상대경로로 전달. hook은 `--no-verify`로 우회 가능하므로 CI가 최종 기준. 롤백: revert 후 `git config --unset core.hooksPath`.

## 2026-10-26 | chore(lint): 문서 규칙을 ESLint로 강제 (feature 경계·네이밍·색상)
- Feature: N/A
- 목적: AGENTS/FRONTEND/DESIGN의 규칙을 문서 요청이 아니라 기계적 게이트로 바꿔 AI·사람의 위반을 verify에서 차단한다.
- 변경: `apps/web/eslint.config.mjs`에 (1) `@/features/<x>/<내부>` import·feature 밖 `../../` 상대 경로·shared→features import 금지(no-restricted-imports) (2) features/shared의 tsx PascalCase, `use*.ts` camelCase, 나머지 ts kebab-case, 폴더 kebab-case(eslint-plugin-check-file 3.3.2 추가) (3) hex/rgb/hsl/oklch 리터럴과 Tailwind 임의 색상 금지(no-restricted-syntax). AGENTS에 lint 강제 표시와 eslint-disable 우회 금지 추가, FRONTEND/DESIGN에 강제 범위와 미강제 범위 명시.
- 영향: 개발 도구만. 현재 코드에 위반 없음.
- 검증: 임시 probe 파일로 위반 9건(폴더명, ts·tsx 파일명, 내부 import, 상대 경로 탈출, shared→feature, 색상 리터럴 3종) 모두 error 확인, 규칙 준수 파일(useProbe.ts, format-label.ts, ProbeCard.tsx/.test.tsx, index import)은 통과 확인 후 probe 삭제. `npm run verify` PASS(3/3).
- 주의/롤백: Tailwind 팔레트 유틸리티(`text-red-500`), 간격/반경/z-index, CSS 파일, `app/` 폴더명은 미강제. feature 내부 2단계 이상 중첩 폴더에서는 `../../`가 막히므로 필요 시 규칙 조정. revert로 롤백.

## 2026-10-26 | refactor: ADR-002 반영 — packages/core와 FSD 폴더 제거
- Feature: N/A
- 목적: ADR-002 결정(기능 단위 구조, RN 공유용 core 제거)을 코드에 반영해 문서와 구조를 일치시킨다. 다음 단계의 import 경계 린트가 이 구조를 기준으로 한다.
- 변경: `packages/core`(theme.ts 포함), `apps/web/src/{views,widgets,shared/ui}` 삭제. web의 core 의존성·tsconfig paths·transpilePackages 제거, page.tsx의 core import 확인 코드 제거. features/shared README를 FRONTEND.md 참조로 교체. globals.css를 토큰 원본으로 명시, layout 설명을 v0.3 태그라인으로 갱신. 루트 workspaces의 `packages/*`는 spec 03의 향후 패키지용으로 유지.
- 영향: 웹 화면 변화 없음(빈 페이지, sr-only 텍스트 유지). 토큰 값 변화 없음.
- 검증: `npm run verify` PASS(format:check, lint/typecheck/test 3/3). `npm run build` PASS(`/`, `/_not-found` 정적 생성). allow-scripts 보류 상태에서도 빌드 성공 확인.
- 주의/롤백: 삭제 파일은 이 커밋의 부모에서 복원 가능. revert로 롤백.

## 2026-10-26 | style: Prettier 일괄 적용
- Feature: N/A
- 목적: 이후 diff에 서식 변경이 섞이지 않도록 기존 파일을 한 번에 정렬한다.
- 변경: 27개 파일(문서 표 정렬·JSON 예시 공백, globals.css, turbo.json, CI 예시). 의미 변경 없음. HISTORY.md는 불변 규칙 때문에 포맷 대상에서 제외.
- 영향: 서식만. `git blame` 시 이 커밋은 건너뛰어도 된다.
- 검증: `npm run verify` PASS(format:check 통과, turbo lint/typecheck/test 4/4).
- 주의/롤백: revert로 롤백. 추후 `.git-blame-ignore-revs`에 등록 고려.

## 2026-10-26 | chore: verify 단일 완료 게이트와 Prettier 도입
- Feature: N/A
- 목적: AI·사람·CI가 같은 명령 하나로 완료를 판정하게 한다. 문서 규칙("검증 후 보고")을 실행 가능한 게이트로 바꾸는 첫 단계.
- 변경: 루트 `verify`(format:check → turbo lint/typecheck/test), `typecheck`, `format`, `format:check` 스크립트. web `typecheck`(next typegen + tsc), core `typecheck`. turbo `typecheck` 태스크. Prettier + tailwind 클래스 정렬 플러그인 설정. CI 예시를 verify 기준으로 수정. AGENTS/QUALITY/README에 verify 명시.
- 영향: 개발 도구만. 런타임 코드 변경 없음. 기존 파일 재포맷은 다음 커밋에서 분리.
- 검증: `npx turbo run lint typecheck test` PASS(4/4, web 테스트 1개). 타입 오류 파일을 임시로 넣어 typecheck 실패(TS2322) 확인 후 제거. `npm run verify`는 재포맷 전이라 format:check 실패가 예상되어 다음 커밋에서 실행.
- 주의/롤백: `npm install` 시 sharp·unrs-resolver 등 install script가 npm allow-scripts 정책으로 보류됨(현재 검사는 영향 없음, 빌드 시 확인 필요). revert로 롤백.

## 2026-10-26 | docs: v0.3 스펙과 AI 하네스로 문서 체계 재정비
- Feature: N/A
- 목적: 이전 기획(Spring/FSD/중첩 컬렉션)과 v0.3 스펙이 공존해 원본이 불분명했다. 스펙 원본과 AI 작업 규칙을 하나로 정한다(ADR-001).
- 변경: `docs/spec`(01~05), `docs/prompts`(06~07), `docs/standards`, ADR-001/002, Feature·Task 템플릿, OPEN-QUESTIONS, QA·HISTORY 문서, `scripts/check-history.py`, CI 예시 추가. PROJECT/ARCHITECTURE/TECH_STACK/STYLING 삭제. AGENTS/CLAUDE/README 갱신, globals.css 주석 참조 수정.
- 영향: 문서 전용. 코드 동작 변경 없음(CSS 주석 1줄).
- 검증: `python3 scripts/check-history.py` 실행. lint/test/build 미실행(코드 변경 없음).
- 주의/롤백: 삭제한 이전 문서는 `afd3cbd`에서 복원 가능. ADR-002의 폴더 정리는 아직 미반영.
