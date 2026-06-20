# Keepio — Claude 작업 규칙

Keepio 프로젝트에서 코드를 작성·수정할 때 아래 규칙을 지킨다. 제품 맥락·스택·아키텍처는 import한 문서를 따른다.

**모노레포 구조:** `apps/web`(Next.js) + `packages/core`(@keepio/core, 플랫폼 무관 로직). 명령어는 루트에서 turbo로 실행(`npm run dev/build/lint/test`). 폴더 배치·레이어 규칙은 `docs/ARCHITECTURE.md`.

## 참조 문서

@AGENTS.md
@docs/PROJECT.md
@docs/TECH_STACK.md
@docs/STYLING.md
@docs/ARCHITECTURE.md

## 작업 규칙

1. **Next.js 16은 추측 금지** — 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 읽는다. (AGENTS.md)
2. **App Router·서버 컴포넌트 기본** — `"use client"`는 상호작용이 필요할 때만 최상단에 명시.
3. **TypeScript strict** — `any` 회피, 타입을 명시한다.
4. **스타일은 토큰만** — 그레이스케일 + AI 보라(`#7F77DD`)만. 임의 hex·그라데이션·과한 그림자·이모지 금지. (docs/STYLING.md)
5. **두 분류 축 용어 고정** — `카테고리`(자동 분류) vs `컬렉션`(사용자, 중첩 가능). 혼용하지 않는다. (docs/PROJECT.md)
6. **AI 출력 시각 구분** — 자동 추출 정보는 검은 텍스트, 사용자 입력은 회색 dashed.
7. **FSD 아키텍처 준수** — 폴더 위치·레이어 책임·import 방향·모노레포 배치는 `docs/ARCHITECTURE.md`를 따른다.
8. **의존성 추가 전 확인** — 스택을 가볍게 유지한다.
9. **테스트는 핵심 구조만** — 핵심 비즈니스 로직(분류 규칙·컬렉션 트리·비교 로직)과 주요 플로우만 테스트한다. 커버리지 임계치 강제는 하지 않는다. (Vitest, `*.test.ts(x)` 코로케이션)
10. **커밋/푸시는 요청 시에만** 한다.

## 새 기능 구현 시 함께 설명

새 기능·컴포넌트를 만들 때 다음을 순서대로 함께 제시한다:

1. **폴더 위치** — 예: `features/create-bookmark`
2. **책임** — entity / feature / widget / page / shared 중 어디인지
3. **이유** — 왜 그 위치가 적절한지
4. **코드 예시** — 실제 TypeScript 코드
5. **리팩토링 포인트** — 현재 구조에서 개선 가능한 부분
6. **React Native 확장성** — 재사용 가능한 부분 / UI 분리 포인트
