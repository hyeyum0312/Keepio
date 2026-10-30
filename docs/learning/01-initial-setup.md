# 학습 노트 01 — 초기 세팅 전체 구조

> **스냅샷: 2026-10-29** (dev `f8065b6`, 기능 구현 전 기본 세팅 완료 시점). 학습용 설명 문서다.
> 규칙의 원본은 링크한 각 문서(ADR·standards·코드)이며, 이 문서와 다르면 원본이 맞다. 내용이 낡으면 새 노트를 추가하고 이 문서는 고치지 않는다.

## 0. 큰 그림

```
Keepio/ (모노레포: npm workspaces + Turborepo)
├─ apps/web             Next.js 16 · React 19.3 · TanStack Query   :7710
├─ apps/api             NestJS 12 · Prisma 7 · PostgreSQL 16        :7711 (DB :7712)
├─ packages/api-client  OpenAPI → Orval 생성 타입·훅
├─ prisma/              DB 스키마·마이그레이션
├─ docs/                규칙(standards)·결정(ADR)·기록(HISTORY, AI-LOG)
└─ .github/ .githooks/ .claude/   CI·Git 훅·AI 하네스
```

데이터 흐름: **api 코드 → OpenAPI 문서 → api-client(자동 생성) → web 훅 호출**. 백엔드 계약이 바뀌면 프론트 타입이 따라오고, 어긋나면 CI가 막는다.

## 1. 공통 툴체인

| 항목           | 내용                                                | 이유                                                |
| -------------- | --------------------------------------------------- | --------------------------------------------------- |
| Node 고정      | 24.22.1 (`.nvmrc`·`engines`·`.npmrc engine-strict`) | 24.19.0에 RCE 취약점. 다른 버전이면 설치가 실패한다 |
| npm workspaces | `apps/*`, `packages/*`                              | 의존성·lockfile 하나로 관리                         |
| Turborepo      | `turbo run lint typecheck test build`               | 작업 순서(의존성)와 캐시. 바뀐 패키지만 다시 실행   |
| 의존성 정책    | 정확한 버전, 공개 14일 지난 릴리스만                | 공급망 공격·초기 버그 회피                          |

배울 것

- Turborepo `dependsOn`(`^build`)과 캐시 키(inputs) — [turbo.json](../../turbo.json)
- npm `overrides` 범위 지정: `"@scalar/json-magic@0.15.7": { "undici": "7.30.1" }`처럼 버전 지정 키로 한 경로만 바꾼다. 중첩 키(`a > b > c`)는 하위 트리 전체에 적용된다 — [package.json](../../package.json)
- lockfile 잔존 함정: 버전을 올려도 lock의 옛 항목이 남을 수 있다. 해당 항목을 지우고 재설치한 뒤 `npm ls`로 확인한다([AI-LOG](../qa/AI-LOG.md) 2026-10-26·29)

## 2. Web (`apps/web`)

- Next.js 16 App Router, React 19.3, Tailwind.
- 구조([ADR-002](../decisions/ADR-002-feature-first-structure.md)): `src/features/<name>` 기능 단위. 다른 feature는 `index.ts`로만 import.
- ESLint로 강제하는 규칙([eslint.config.mjs](../../apps/web/eslint.config.mjs)): 색상 리터럴 금지(토큰만), 파일·폴더 네이밍, shared → features 의존 금지, 테스트 규칙.
- 서버 상태: TanStack Query 기본 정책([query-client.ts](../../apps/web/src/app/query-client.ts)) — 창 포커스 재요청 끔, 쿼리 재시도 1회, 뮤테이션 0회. 불필요한 요청은 서버 비용이다.
- [providers.tsx](../../apps/web/src/app/providers.tsx)가 api-client에 API 주소를 연결한다. 운영 빌드에서 `NEXT_PUBLIC_API_BASE_URL`이 없으면 빌드 실패.
- 테스트: Vitest + jsdom + Testing Library.

배울 것

- 서버 상태 vs 클라이언트 상태, QueryClient 기본값(staleTime·retry)
- `NEXT_PUBLIC_*`는 빌드 시점에 코드에 박힌다
- React는 앱 전체에 한 벌이어야 한다. peer 해석으로 두 벌이 설치되면 hooks 오류가 난다(2026-10-29 사례)

## 3. API (`apps/api`)

NestJS 12(ESM), Prisma 7(adapter-pg), PostgreSQL 16. 공통 계약은 [ADR-006](../decisions/ADR-006-api-error-logging-env.md).

| 기능           | 파일                                                                                                                                 | 핵심                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 오류 응답      | [api-error.ts](../../apps/api/src/common/api-error.ts), [api-exception.filter.ts](../../apps/api/src/common/api-exception.filter.ts) | 모든 오류 `{ code, message, requestId, details? }`. 도메인 오류는 `ApiException` |
| 요청 추적      | [request-context.ts](../../apps/api/src/common/request-context.ts)                                                                   | `x-request-id` 검증·생성, AsyncLocalStorage                                      |
| 접근 로그      | 같은 파일                                                                                                                            | 쿼리 문자열 제외(토큰 노출 방지), 운영은 JSON 로그                               |
| 환경 변수 검증 | [env.ts](../../apps/api/src/config/env.ts)                                                                                           | 기동 시 검증, 실패 시 비밀값 없이 종료                                           |
| 헬스체크       | `/health`                                                                                                                            | DB 상태 포함, DB 장애 시 503                                                     |

- 보안 사례: Nest 기본 404 메시지가 쿼리를 응답에 되돌려줬다 → `Not found` 고정 + 회귀 테스트(수정 전 실패 확인).
- 테스트([ADR-004](../decisions/ADR-004-api-toolchain.md)): 단위는 Vitest + SWC, 통합(`*.int.test.ts`)은 실제 PostgreSQL. DB 이름이 `_test`로 끝날 때만 실행.

배울 것

- Nest 전역 예외 필터·미들웨어, AsyncLocalStorage
- Prisma 7 adapter 방식, `migrate dev`(개발) vs `migrate deploy`(테스트·운영) — [SETUP.md](../SETUP.md)

## 4. API 계약 (`packages/api-client`)

- [ADR-005](../decisions/ADR-005-orval-tanstack-query.md): api 빌드 → `openapi-export.js`로 `openapi.json` → Orval이 react-query 훅·fetch 함수 생성.
- `npm run openapi:check`([check-openapi.sh](../../scripts/check-openapi.sh))가 매번 재생성해 커밋된 결과와 다르면 실패한다.

배울 것: contract-first vs code-first, OpenAPI 스키마와 코드 생성.

## 5. 품질 게이트 (빠른 것 → 느린 것)

| 시점           | 범위                                                                      | 파일                                                                               |
| -------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 파일 편집 (AI) | 그 파일 Prettier + ESLint                                                 | [post-edit.sh](../../.claude/hooks/post-edit.sh)                                   |
| 커밋 직전      | 보호 브랜치 차단, HISTORY 형식, staged 파일 포맷, 관련 테스트만           | [pre-commit](../../.githooks/pre-commit)                                           |
| 작업 완료      | `npm run verify`: 포맷 → OpenAPI 동기화 → lint·typecheck·test(turbo 캐시) | [package.json](../../package.json)                                                 |
| PR             | 바뀐 패키지만 verify·DB 통합·build                                        | [ci.yml](../../.github/workflows/ci.yml), [ci-scope.sh](../../scripts/ci-scope.sh) |
| 주 1회·수동    | 전체 검사(변경 감지가 놓친 것을 잡는 안전망)                              | ci.yml `schedule`                                                                  |

- 편집마다 테스트를 돌리지 않는다. 수정 중 상태는 원래 실패한다([QUALITY.md](../standards/QUALITY.md)).
- 함정: turbo는 루트 `prisma/` 변경을 어느 패키지에도 연결하지 못한다 → prisma가 바뀌면 전체 검사.

배울 것: 테스트 피라미드, `turbo --affected`와 `TURBO_SCM_BASE`, GitHub Actions `services`(postgres)와 `if` 조건.

## 6. Git과 브랜치

규칙 원본: [BRANCHING.md](../standards/BRANCHING.md), 결정: [ADR-007](../decisions/ADR-007-branch-strategy.md).

```
feature/* ─PR(squash)─▶ dev ─PR(merge)─▶ stg ─PR(merge)─▶ prod
hotfix/*  ─PR─▶ prod ─▶ stg ─▶ dev   (긴급 수정 역반영)
```

- GitHub ruleset: PR 필수, CI `verify` 필수, 강제 push·삭제 금지, 리뷰 승인 미요구(혼자 개발).
- 허용되지 않은 PR 경로는 CI가 실패시킨다. PR merge는 사용자가 한다.
- HISTORY는 맨 위에 추가만 가능. 기존 기록 수정은 [check-history.py](../../scripts/check-history.py)가 막는다.

배울 것

- squash vs merge commit: 승격 PR을 squash하면 브랜치 이력이 갈라진다
- GitHub Rulesets와 필수 상태 체크
- 같은 커밋에 실패한 체크가 붙으면 다른 PR까지 막힌다 → 검증용 PR은 별도 브랜치·커밋(PR #9·#10 사례)

## 7. 의존성과 보안

- Dependabot([dependabot.yml](../../.github/dependabot.yml)): npm 주간·Actions 월간, 14일 대기. @types/node·TypeScript·ESLint 메이저는 제외하고 별도 검토.
- GitHub: Secret scanning, push protection, 취약점 알림, 보안 업데이트 켬.
- 2026-10-29 정리(PR #14): undici 취약점은 범위 지정 override로 해소(경보 8건 fixed), React 19.3.1 단일화, Actions v7.
- Dependabot PR은 HISTORY 항목이 없어 CI가 실패하도록 설계했다. 리뷰어가 릴리스 노트를 확인하고 기록해야 merge된다.

배울 것: semver 범위(`^` vs 정확한 버전), peer dependency 해석과 호이스팅으로 인한 중복 설치.

## 8. 배포 (미결정, D-12)

- 지금은 브랜치(dev·stg·prod)만 있고 환경은 없다. 승격 PR은 CI 검증만 한다.
- 계획: 호스팅 결정 후 dev → stg → prod 순서로 환경을 늘린다. 출시 전 prod를 미리 띄우면 비용만 든다.
- Amplify를 쓴다면 web 담당. API·DB는 App Runner·ECS·RDS 같은 별도 서비스가 필요하다.
- 배포 단계에서 정할 것: 브랜치별 재빌드 vs 빌드 결과 재사용, 로그 수집, turbo 원격 캐시, 보안 헤더·rate limit(인증과 함께), CORS.

## 9. AI 협업 하네스

- [AGENTS.md](../../AGENTS.md)가 원본: 지시하지 않은 작업은 먼저 묻기, 근거 확인, 실제 실행한 검증만 보고, 비용 고려하되 필수 요소(보안·정확성 등)는 줄이지 않기.
- 스킬: `/task`(계획) → `/feature`(명세) → `/finish`(검증·기록·커밋) — `.claude/skills/`.
- 기록: [AI-LOG](../qa/AI-LOG.md)(AI 실수 → 게이트 전환), [ADR](../decisions/), [HISTORY](../HISTORY.md).

## 10. 다음 단계

- 메이저 업데이트 검토: TypeScript 7, ESLint 10.
- 필요할 때: Playwright(첫 화면), 백엔드 모듈 경계 lint(두 번째 모듈), CORS(web에서 API 첫 호출).
- 기능 구현: FEAT-001 북마크 저장([명세](../features/bookmark-save.md)).
