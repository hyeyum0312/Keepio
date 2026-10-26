# keepio

외부 앱에서 공유한 링크를 저장하고 AI로 정리한 뒤, 버킷으로 묶어 웹페이지로 발행하는 서비스. 스펙은 [docs/spec/](docs/spec/), 문서 목차는 [docs/README.md](docs/README.md).

## 현재 상태

- `apps/web`: Next.js 스켈레톤(빈 페이지 + 테스트 1개). 기능 구현 전.
- `apps/api`: NestJS 12 + Prisma 7 + PostgreSQL 16 스켈레톤(`GET /health`에 DB 상태, `/docs` OpenAPI). 설치·실행: [docs/SETUP.md](docs/SETUP.md). 도구 결정은 [ADR-004](docs/decisions/ADR-004-api-toolchain.md).
- `apps/worker`, `apps/mobile`: 아직 없음([03 폴더 구조](docs/spec/03-BACKEND-ARCHITECTURE.md)).
- 웹 구조는 기능 단위([ADR-002](docs/decisions/ADR-002-feature-first-structure.md)). 공유 패키지(`packages/*`)는 필요해질 때 만든다.

## 명령어 (루트, turbo)

| 목적                              | 명령어                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------- |
| 설치                              | `npm install`                                                                     |
| 개발 서버                         | `npm run dev` (web만: `npm run dev:web`, api만: `npm run dev:api`)                |
| 로컬 DB                           | `npm run db:up` / `db:down` / `db:deploy` / `db:migrate` ([SETUP](docs/SETUP.md)) |
| 완료 판정 (포맷·린트·타입·테스트) | `npm run verify`                                                                  |
| 빌드 / 린트 / 타입 / 테스트       | `npm run build` / `npm run lint` / `npm run typecheck` / `npm run test`           |
| 포맷 적용                         | `npm run format`                                                                  |

특정 워크스페이스만: `npm run <script> --workspace=@keepio/web`

## AI 협업

1. 에이전트는 [AGENTS.md](AGENTS.md)를 먼저 읽는다. Claude는 [CLAUDE.md](CLAUDE.md) 진입점을 사용.
2. 새 기능은 [docs/features/FEATURE-TEMPLATE.md](docs/features/FEATURE-TEMPLATE.md)로 먼저 명세한다.
3. 매 커밋 [docs/HISTORY.md](docs/HISTORY.md)를 최신순으로 갱신한다. `npm install` 후 git pre-commit이 형식과 staged 파일 포맷을 검사한다.
4. 작업 흐름: `/task <요청>` → `/feature <이름>`(새 기능) → 구현 → `/finish`.
5. Claude Code 설정은 [.claude/settings.json](.claude/settings.json): 편집 시 Prettier·ESLint 훅, 안전한 명령 허용 목록.
