# Keepio — 기술 스택 & 웹 설정

> 새 코드를 작성하기 전에 이 스택과 버전을 전제로 한다. **추측하지 말 것** — Next.js 16은 학습 데이터와 다를 수 있으므로 `node_modules/next/dist/docs/`의 해당 가이드를 먼저 읽는다.

## 핵심 스택

| 영역 | 기술 | 버전 |
|---|---|---|
| 모노레포 | Turborepo + npm workspaces | turbo ^2 |
| 프레임워크 | Next.js (**App Router**) | 16.2.9 |
| UI 라이브러리 | React | 19.2.4 |
| 언어 | TypeScript | ^5 |
| 스타일링 | Tailwind CSS (`@tailwindcss/postcss`) | ^4 |
| 상태 | Zustand(클라이언트) / TanStack Query(서버) | 예정 |
| API 코드젠 | Orval (OpenAPI → Query 훅) | 예정 |
| 린트 | ESLint (`eslint-config-next`) | ^9 |
| 테스트 | Vitest + Testing Library | vitest ^4 |

## 디렉터리 구조 (모노레포)

```
keepio/
├── apps/web/        # @keepio/web — Next.js 앱 (UI·라우팅)
├── packages/core/   # @keepio/core — 플랫폼 무관 로직 (web·mobile 공유)
└── docs/            # 프로젝트 지식 문서
```

상세 FSD 레이어 구조와 배치 규칙은 `docs/ARCHITECTURE.md` 참고. 향후 `apps/mobile`(React Native/Expo)이 `@keepio/core`를 공유한다.

## 명령어 (루트에서 turbo로 실행)

| 목적 | 명령어 |
|---|---|
| 개발 서버 (web) | `npm run dev` |
| 프로덕션 빌드 | `npm run build` |
| 린트 | `npm run lint` |
| 테스트 | `npm run test` |
| web만 dev | `npm run dev:web` |

> 특정 워크스페이스만 실행: `npm run <script> --workspace=@keepio/web`

## 테스트

- **Vitest + Testing Library** (jsdom 환경).
- 테스트 파일은 소스 옆에 `*.test.ts(x)`로 **코로케이션**한다.
- **지금 단계: 핵심 구조만** — 핵심 비즈니스 로직(분류 규칙·컬렉션 트리·비교 로직)과 주요 플로우 위주. 전 컴포넌트·커버리지 임계치 강제는 안정화 이후로 미룬다.
- 설정: `vitest.config.mts`, `vitest.setup.ts`.

## 규칙

- **App Router 전용** — `pages/` 라우터를 쓰지 않는다.
- 기본은 **서버 컴포넌트**. 상호작용·상태가 필요할 때만 `"use client"`를 파일 최상단에 명시한다.
- 경로 별칭은 `tsconfig.json`의 설정을 따른다 (예: `@/*`).
- 새 의존성을 추가하기 전에 사용자에게 확인한다 — 스택을 가볍게 유지한다.
