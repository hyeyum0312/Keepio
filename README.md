# keepio

외부 앱에서 공유한 링크를 저장하고 AI로 정리한 뒤, 버킷으로 묶어 웹페이지로 발행하는 서비스. 스펙은 [docs/spec/](docs/spec/), 문서 목차는 [docs/README.md](docs/README.md).

## 현재 상태

- **단계: 기본 세팅 완료, 기능 구현 전.** 모바일·디자인 시스템·배포는 보류([OPEN-QUESTIONS](docs/OPEN-QUESTIONS.md) D-08·D-09·D-12).
- `apps/web`: Next.js 16 빈 페이지, TanStack Query Provider·기본 요청 정책(API 주소 `NEXT_PUBLIC_API_BASE_URL`).
- `apps/api`: NestJS 12 + Prisma 7 + PostgreSQL 16 스켈레톤(`GET /health`에 DB 상태, `/docs` OpenAPI). 설치·실행: [docs/SETUP.md](docs/SETUP.md). 도구 결정은 [ADR-004](docs/decisions/ADR-004-api-toolchain.md), 공통 오류 응답·요청 ID·로그·환경 변수 검증은 [ADR-006](docs/decisions/ADR-006-api-error-logging-env.md).
- `apps/worker`, `apps/mobile`: 아직 없음([03 폴더 구조](docs/spec/03-BACKEND-ARCHITECTURE.md)).
- `packages/api-client`: api OpenAPI에서 Orval로 생성한 TanStack Query 훅·타입([ADR-005](docs/decisions/ADR-005-orval-tanstack-query.md)). 손으로 고치지 않고 `npm run openapi:generate`.
- 웹 구조는 기능 단위([ADR-002](docs/decisions/ADR-002-feature-first-structure.md)). 그 외 공유 패키지는 필요해질 때 만든다.

## 명령어 (루트, turbo)

| 목적                                             | 명령어                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| 설치                                             | `npm install`                                                                     |
| 개발 서버                                        | `npm run dev` (web만: `npm run dev:web`, api만: `npm run dev:api`)                |
| 로컬 DB                                          | `npm run db:up` / `db:down` / `db:deploy` / `db:migrate` ([SETUP](docs/SETUP.md)) |
| 완료 판정 (포맷·OpenAPI 동기화·린트·타입·테스트) | `npm run verify`                                                                  |
| DB 통합 테스트                                   | `npm run db:migrate:test && npm run test:integration`                             |
| 빌드 / 린트 / 타입 / 테스트                      | `npm run build` / `npm run lint` / `npm run typecheck` / `npm run test`           |
| 포맷 적용                                        | `npm run format`                                                                  |

특정 워크스페이스만: `npm run <script> --workspace=@keepio/web`

## AI 협업

1. 에이전트는 [AGENTS.md](AGENTS.md)를 먼저 읽는다. Claude는 [CLAUDE.md](CLAUDE.md) 진입점을 사용.
2. 새 기능은 [docs/features/FEATURE-TEMPLATE.md](docs/features/FEATURE-TEMPLATE.md)로 먼저 명세한다.
3. 매 커밋 [docs/HISTORY.md](docs/HISTORY.md)를 최신순으로 갱신한다. `npm install` 후 git pre-commit이 형식과 staged 파일 포맷을 검사한다.
4. 작업 흐름: `/task <요청>` → `/feature <이름>`(새 기능) → 구현 → `/finish`.
5. Claude Code 설정은 [.claude/settings.json](.claude/settings.json): 편집 시 Prettier·ESLint 훅, 안전한 명령 허용 목록.
