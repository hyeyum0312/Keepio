# ADR-002: 웹 프론트는 FSD 대신 기능 단위 구조, packages/core 제거

- Status: accepted (2026-10-26)
- Context / problem:
  - FSD는 한 도메인(예: 북마크)을 entities / features / widgets / views에 나눠 담는다. 도메인 수가 적은 MVP에서는 파일이 흩어지고 레이어 판단 비용이 크다.
  - `packages/core`는 React Native와 로직을 공유하려고 만들었다. 모바일이 Expo 셸 + WebView로 바뀌어 화면 코드는 web 하나이므로 그 근거가 사라졌다.
- Options:
  - 프론트: (a) FSD 유지 (b) 기능 단위 `features/<domain>/{ui,model,api,lib}`
  - 공유 패키지: (a) `packages/core` 유지 (b) 제거하고 spec 03의 `packages/shared`, `packages/api-client`를 필요해질 때 만든다
- Decision: 모두 (b). 구조는 `standards/FRONTEND.md`의 Structure.
  - 다른 feature는 `index.ts`로만 import. `shared/`는 두 번째 사용처가 생겼을 때만. `app/`은 조합만.
  - 디자인 토큰 원본은 `apps/web`의 CSS 변수(`theme.ts` 제거).
  - 백엔드 폴더(`apps/api`, `apps/worker`, 루트 `prisma/`)는 spec 03을 그대로 따른다.
- Consequences / side effects:
  - feature 간 의존이 늘면 경계가 흐려질 수 있다. 내부 import 금지를 린트로 강제하는 것을 검토한다.
- Verification: 폴더 정리 커밋 후 `npm run lint`, `npm run test`, `npm run build` 실행.
- Rollback / migration: 현재 코드는 빈 스켈레톤이라 되돌리는 비용이 작다. 폴더 정리는 별도 커밋, Git으로 복원 가능.
