# features

**사용자 행동 단위 기능.** "무엇을 한다"가 명확한 동작.

- 의존 가능: `entities`, `shared`
- API 호출은 이 레이어의 `api`/`model` 세그먼트에서 처리 (UI에서 직접 호출 금지).
- 예시: `features/create-bookmark`, `features/add-to-collection`, `features/classify-bookmark`, `features/compare-candidates`

## 슬라이스 내부 세그먼트

```
features/create-bookmark/
├── ui/        # 컴포넌트 (플랫폼 의존)
├── model/     # 상태·로직 (Zustand, 플랫폼 무관)
├── api/       # 서버 통신 (TanStack Query, 플랫폼 무관)
├── lib/       # 순수 헬퍼
└── index.ts   # Public API — 외부엔 이것만 노출
```
