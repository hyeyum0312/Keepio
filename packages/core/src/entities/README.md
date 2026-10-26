# entities (core — 로직)

**비즈니스 도메인 모델의 플랫폼 무관 로직.** Keepio의 핵심 개념.

- 여기엔 `model`(타입·Zustand)·`api`(Orval/Query)·`lib`(순수 로직)만 둔다.
- **UI(`ui` 세그먼트)는 여기 두지 않는다** — 엔티티의 화면 컴포넌트(BookmarkCard 등)는 플랫폼별로 다르므로 각 앱(`apps/web`, 추후 `apps/mobile`)에 둔다.
- 의존 가능: `@keepio/core`의 `shared` (그리고 필요 시 `@x` cross-import).
- import는 항상 슬라이스의 `index.ts`(Public API)를 통해서만.

## 도메인

| 슬라이스     | 의미                                         |
| ------------ | -------------------------------------------- |
| `bookmark`   | 저장된 링크 1개 (출처·메타·메모)             |
| `collection` | 사용자가 만든 프로젝트·맥락 묶음 (중첩 가능) |
| `category`   | AI 자동 분류 콘텐츠 타입                     |
| `comparison` | 후보 비교·결정 단위                          |

> 슬라이스는 **필요할 때 직접** 만든다 (미리 빈 폴더로 깔지 않음).
