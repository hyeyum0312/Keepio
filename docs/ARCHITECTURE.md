# Keepio — Architecture

Keepio의 아키텍처 설계 결정을 정리한 문서다. 폴더 구조·레이어 책임·확장 전략의 근거를 담는다.

## 설계 목표

1. 관심사가 명확히 분리된 구조
2. React Native 앱으로 확장 가능한 코드 공유 구조
3. 백엔드(Spring Boot)를 나중에 연결해도 무너지지 않는 경계
4. 과도한 추상화를 피한 현실적인 수준

## 도메인 모델

| 도메인 | 의미 |
|---|---|
| `Bookmark` | 저장된 링크 1개 (출처·메타·메모) |
| `Collection` | 사용자가 만든 프로젝트·맥락 묶음 (중첩 가능: 여행 > 강릉) |
| `Category` | 콘텐츠 타입 자동 분류 (카페·호텔·맛집·영상…) |
| `Comparison` | 컬렉션 안 후보들을 비교·결정하는 단위 |

## 상태 관리 — 책임 분리

서버 상태와 클라이언트 상태를 **서로 다른 도구로** 관리하며, 책임을 섞지 않는다.

| 도구 | 책임 |
|---|---|
| **TanStack Query** | 서버 상태 — fetch·캐시·동기화·로딩/에러 |
| **Zustand** | 클라이언트 상태 — UI·일시적 상태 (선택 모드, 모달, 비교 후보 임시 담기) |

> 서버에서 온 데이터는 Query가, 화면 로컬 상태는 Zustand가 관리한다.

## FSD (Feature-Sliced Design)

### 레이어 (위 → 아래로만 의존)

```
app        앱 초기화, 전역 provider, 라우팅 진입
pages      라우트 단위 화면 조립 (Next App Router와 연결)
widgets    여러 feature/entity를 조합한 독립 UI 블록
features   사용자 행동 단위 기능 (북마크 생성, 컬렉션에 담기, 비교하기)
entities   비즈니스 도메인 모델 (bookmark, collection, category, comparison)
shared     도메인 무관 공용 (ui kit, api client, lib, config, types)
```

**상위 레이어만 하위를 import 한다.** `entities`는 `features`를 모르고, `shared`는 아무것도 모른다. 같은 레이어끼리 직접 import는 금지하며, 불가피한 경우 entities의 `@x` cross-import로만 예외 처리한다.

### 슬라이스 내부 세그먼트

각 슬라이스(예: `entities/bookmark`)는 책임별 세그먼트로 나뉜다.

```
entities/bookmark/
├── ui/        컴포넌트 (플랫폼 의존)
├── model/     상태·타입·로직 (Zustand store, types, 셀렉터) — 플랫폼 무관
├── api/       서버 통신 (queryFn, queryKey, Query 훅) — 플랫폼 무관
├── lib/       순수 헬퍼 (포맷터, 트리 계산 등) — 플랫폼 무관
└── index.ts   Public API (외부에 노출할 것만 export)
```

import는 반드시 슬라이스의 `index.ts`(Public API)를 통한다. 내부 파일을 깊게 import 하지 않으므로, 내부 구조를 바꿔도 사용하는 쪽은 영향받지 않는다.

## 모노레포 구조

Turborepo + npm workspaces 모노레포다. 플랫폼 무관 로직을 `@keepio/core`로 분리해, 향후 React Native 앱(`apps/mobile`)이 같은 패키지를 공유한다.

```
keepio/
├── apps/
│   └── web/                  @keepio/web — Next.js (UI·라우팅)
│       └── src/
│           ├── app/          Next App Router (얇은 page.tsx) + 전역 provider
│           ├── views/        FSD pages 레이어 — 라우트별 화면 조립
│           ├── widgets/      bookmark-list, collection-tree, comparison-board…
│           ├── features/     create-bookmark, add-to-collection…
│           └── shared/ui/    웹 디자인 시스템 (Button, Sheet…)
└── packages/
    └── core/                 @keepio/core — 플랫폼 무관 (web·mobile 공유)
        └── src/
            ├── entities/     도메인 model·api·lib
            ├── shared/
            │   ├── api/      http mutator, queryClient, API 코드젠 산출물
            │   ├── lib/      공용 유틸·범용 훅
            │   ├── config/   상수, env, theme.ts (디자인 토큰 SSOT)
            │   └── types/
            └── index.ts      Public API
```

배치 원칙:

- 플랫폼 무관 로직(`entities`의 model/api/lib, `shared`의 api/lib/config/types) → `packages/core`
- 플랫폼 의존 UI(`app`/`views`/`widgets`/`features`/`shared/ui`) → `apps/web`
- 엔티티의 화면 컴포넌트(BookmarkCard 등)는 플랫폼별로 다르므로 `apps/web`에 둔다 (core의 entities엔 ui 없음)
- import 경로: web에서 core는 `@keepio/core`, web 내부는 `@/*` (= `apps/web/src/*`)
- 슬라이스는 필요할 때 만든다 (빈 폴더를 미리 만들지 않음)

> Next.js App Router의 `app/`이 FSD `pages` 레이어와 이름이 겹치므로, FSD pages 레이어는 `views/`로 두고 `app/`은 라우팅 전용으로 얇게 유지한다.

## 라우팅

웹은 Next.js App Router의 파일 기반 라우팅을 따른다. `app/`의 폴더 구조가 곧 URL이며, `page.tsx`는 라우팅 진입점으로 얇게 유지하고 실제 화면은 `views`에서 조립한다.

```tsx
// apps/web/src/app/library/page.tsx — 라우팅 진입 (얇게)
import { LibraryPage } from "@/views/library";
export default function Page() {
  return <LibraryPage />;
}
```

라우팅은 Next, 화면 구성은 FSD가 담당한다. React Native에서는 이 `app/` 레이어만 RN 네비게이션으로 대체되고 `views` 이하는 재사용된다.

## React Native 확장 전략

확장성의 핵심은 **플랫폼 의존 코드와 무관 코드의 분리**다.

| 세그먼트 | 플랫폼 의존 | RN 확장 시 |
|---|---|---|
| `model` (상태·타입·로직) | 무관 | 그대로 재사용 |
| `api` (Query, fetch) | 무관 | 그대로 재사용 |
| `lib` (순수 헬퍼) | 무관 | 그대로 재사용 |
| `ui` (컴포넌트) | 의존 | 웹: React DOM / RN: React Native View 로 교체 |
| `shared/ui` | 의존 | 플랫폼별 디자인 시스템으로 분기 |

- **RN 앱 추가 시:** `apps/mobile`(Expo)을 만들고 `@keepio/core`를 의존성에 추가 → entities·shared 로직은 그대로, `app`(네비게이션)·`views`·`widgets`·`ui`만 RN으로 작성.
- **Spring Boot 연결 시:** `@keepio/core`의 `shared/api` mutator baseURL과 API 코드젠 산출물만 교체하면 된다. 컴포넌트·model·web·mobile 모두 영향받지 않는다.
- **스타일 토큰:** RN에는 CSS·className 개념이 없으므로, 색·간격 등 토큰은 `packages/core/.../config/theme.ts`를 단일 진실(SSOT)로 두고 웹은 CSS(`@theme`)에서, RN은 StyleSheet에서 같은 값을 소비한다.

## 컨벤션

- `page.tsx`는 얇게 유지한다 — 데이터 페칭·로직 없이 view/widget 조립만.
- UI 컴포넌트에서 직접 API를 호출하지 않는다. API 호출은 `api`/`model` 계층에서 처리한다.
- TanStack Query(서버)와 Zustand(클라이언트)의 책임을 구분한다.
- import는 Public API(`index.ts`)를 통한다. 레이어 의존 방향(상위 → 하위)을 지킨다.
- `@keepio/core`에는 플랫폼 의존 코드(`next/*`·`react-dom`·`window`·`document`·Tailwind className)를 두지 않는다.
- 디자인 토큰은 하드코딩하지 않고 `theme.ts`를 참조한다.
