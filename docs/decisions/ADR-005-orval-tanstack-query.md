# ADR-005: API 클라이언트는 Orval(react-query + fetch)로 생성하고, 코드와 명세 불일치를 verify에서 막는다

- Status: accepted (2026-10-28, 클라이언트 도구는 사용자 선택)
- Context / problem:
  - FRONTEND.md: "Typed API client generated or checked against OpenAPI", AGENTS.md: 추측한 API 응답 사용 금지.
  - `apps/api`는 `/docs`로 OpenAPI를 제공하지만 파일로 내보내거나 웹 타입과 연결하는 경로가 없었다.
- Options:
  1. openapi-typescript + openapi-fetch: 타입과 작은 fetch만. 쿼리 라이브러리는 별도 결정.
  2. Orval: fetch 함수와 TanStack Query 훅까지 생성. TanStack Query 도입을 함께 확정.
- Decision: 2번.
  - `apps/api/src/openapi-export.ts`가 Nest **preview 모드**(provider 미생성, DB 불필요)로 `packages/api-client/openapi.json`을 내보낸다. `/docs`와 같은 `createOpenApiDocument`를 쓴다.
  - `packages/api-client`(spec 03의 `packages/api-client`): Orval 8.43.0, `client: react-query`, `httpClient: fetch`, `mode: tags-split`, 커스텀 mutator `apiFetch`. 생성물(`openapi.json`, `src/generated`)은 커밋하고 손으로 고치지 않는다.
  - `apiFetch`는 오류 상태를 throw하지 않고 `{ data, status, headers }` 유니온을 돌려준다. 호출 쪽이 status로 분기한다(예: FEAT-001 `409`).
  - TanStack Query 5.104.3은 api-client의 peer. `QueryClientProvider`와 기본 정책(staleTime·refetch·retry)은 첫 소비 기능에서 FRONTEND.md "Network / state" 규칙대로 문서화하며 추가한다.
  - 게이트: `npm run openapi:check`(재생성 후 해시 비교)를 verify에 포함. 다르면 생성물을 갱신하고 실패한다.
  - 버전은 공개 후 약 2주 지난 릴리스로 정확히 고정(orval 8.45.0·react-query 5.105.0은 3~4일 경과로 보류).
- Consequences / side effects:
  - verify가 api를 빌드하므로 몇 초 늘어난다.
  - 생성 코드 diff가 PR에 섞인다. 리뷰에서는 `openapi.json` diff를 계약 변경으로 본다.
  - Orval 메이저 업그레이드 시 생성물 전체가 바뀔 수 있다.
- Verification: `HealthResponse`에 선택 속성을 추가하고 재생성 없이 `openapi:check` → exit 1, 되돌린 뒤 exit 0. `packages/api-client` typecheck 통과.
- Rollback / migration: `packages/api-client`, `openapi-export.ts`, 루트 스크립트 제거. 소비 코드가 아직 없다.
