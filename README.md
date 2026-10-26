# keepio

외부 앱에서 공유한 링크를 저장하고 AI로 정리한 뒤, 버킷으로 묶어 웹페이지로 발행하는 서비스. 스펙은 [docs/spec/](docs/spec/), 문서 목차는 [docs/README.md](docs/README.md).

## 현재 상태
- `apps/web`: Next.js 스켈레톤(빈 페이지 + 테스트 1개). 기능 구현 전.
- `apps/api`, `apps/worker`, `apps/mobile`: 아직 없음([03 폴더 구조](docs/spec/03-BACKEND-ARCHITECTURE.md)).
- 이전 구조(FSD, `packages/core`)의 빈 폴더가 남아 있으며 정리 예정([ADR-002](docs/decisions/ADR-002-feature-first-structure.md)).

## 명령어 (루트, turbo)
| 목적 | 명령어 |
|---|---|
| 설치 | `npm install` |
| 개발 서버 | `npm run dev` (web만: `npm run dev:web`) |
| 빌드 / 린트 / 테스트 | `npm run build` / `npm run lint` / `npm run test` |

특정 워크스페이스만: `npm run <script> --workspace=@keepio/web`

## AI 협업
1. 에이전트는 [AGENTS.md](AGENTS.md)를 먼저 읽는다. Claude는 [CLAUDE.md](CLAUDE.md) 진입점을 사용.
2. 새 기능은 [docs/features/FEATURE-TEMPLATE.md](docs/features/FEATURE-TEMPLATE.md)로 먼저 명세한다.
3. 매 커밋 [docs/HISTORY.md](docs/HISTORY.md)를 최신순으로 갱신하고, `python3 scripts/check-history.py`로 형식을 검사한다(hook 연결 예정).
