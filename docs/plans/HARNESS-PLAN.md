# keepio AI 개발 하네스 구축 계획

## 구조: 짧은 규칙 + 상세 기준 + 자동화

- `AGENTS.md`: 에이전트 공통 규약(짧고 강한 규칙)
- `CLAUDE.md`: Claude 진입점, AGENTS.md 참조만 유지(복제 금지)
- `docs/standards/`: 역할별 기준(기획, 디자인, 프론트, 백엔드, QA, 운영)
- `docs/plans/`: 변경 단위 계획, 승인, 사이드이펙트
- `docs/qa/`: 테스트 케이스와 **실제** 검증 증거
- `docs/decisions/`: 오래 유지될 아키텍처 결정(ADR)
- `.github/workflows/`: 기계적으로 검증하는 CI

## 현업에서 재현성 높은 방식

단일 거대한 프롬프트보다 버전 관리되는 repo instruction + formatter/linter/typechecker + tests + CI + PR review를 조합한다. AGENTS.md/CLAUDE.md는 에이전트별 읽기 관례가 다르므로 둘 다 두되 규칙의 단일 원본을 만든다. 도구별 지원 범위는 설치 버전에서 검증한다. 문서만으로 코드 스타일·성능·보안을 보장할 수 없으므로 기계적 게이트가 필수다.

## 단계별 적용과 현재 상태 (2026-10-28)

| 단계                | 상태              | 구현 위치 / 남은 것                                                                                                                                                                                              |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 규칙 고정        | 완료              | `AGENTS.md`, `docs/standards/*`, ADR-001~005                                                                                                                                                                     |
| 2. 코드 자동화      | 완료(일부 미강제) | Prettier + Tailwind 정렬, TS strict, ESLint(feature 경계·파일명·색상 리터럴·테스트 규칙). 미강제: Tailwind 팔레트·간격·z-index, 백엔드 모듈 경계(모듈 2개 이상부터)                                              |
| 3. 테스트 자동화    | 진행 중           | Vitest(web·api, ADR-004), Supertest, 실제 PostgreSQL 통합 테스트. 남음: Playwright E2E(첫 UI 기능부터)                                                                                                           |
| 4. Git 게이트       | 완료              | 편집 훅(`.claude/hooks/post-edit.sh`), pre-commit(HISTORY·staged Prettier·관련 테스트), `npm run verify`(포맷·OpenAPI 동기화·lint·typecheck·unit), CI(`ci.yml`: verify·통합·build). 남음: 브랜치 보호(필수 체크) |
| 5. AI 작업 템플릿   | 완료              | `/task`·`/feature`·`/finish`(`.claude/skills/`), TASK/FEATURE 템플릿, `docs/qa/AI-LOG.md`                                                                                                                        |
| 6. 관측 기반 최적화 | 미착수            | 요청 ID·구조화 로그부터(OPERATIONS.md), 수치는 측정 후                                                                                                                                                           |

## CI 실행 정책

- 현재: `dev`·`stg`·`prod` 대상 PR마다(ADR-007, push 재실행 없음) `npm ci` → verify → `db:migrate:test` → `test:integration` → build. PR 경로 검사(BRANCHING.md 허용 경로)·HISTORY 보존 검사 추가.
- 범위: `scripts/ci-scope.sh`가 PR base 브랜치와 비교해 바뀐 패키지(+의존 패키지)만 lint·typecheck·test·build한다(`turbo --affected`). DB 통합 테스트는 api가 범위에 있을 때만. format:check·openapi:check는 매번 전체. prisma·CI 설정·scripts 변경, 주 1회(월 03:00 KST)·수동 실행은 전체 검사.
- 원격 캐시(turbo remote cache)는 외부 계정이 필요해 D-12에서 함께 결정.
- 계획: 웹 E2E. 배포·CD(배포 전 smoke 포함)는 호스팅 결정(D-12) 후 맨 마지막. 모바일은 별도 기기/시뮬레이터 워크플로(네이티브 빌드 비용 고려).
- 실패 시 merge 차단: `dev`·`stg`·`prod` 보호 규칙의 필수 체크 `verify`(ADR-007).

## 적용 주의

- 게이트를 추가할 때는 검증 대상 게이트까지 도달하는 위반 예제로 실패를 먼저 확인한다(ADR-003).
- 검증 결과는 `docs/HISTORY.md`에 실제 실행한 것만 기록한다.
