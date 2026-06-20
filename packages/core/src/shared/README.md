# shared (core)

**플랫폼 무관 공용 코드.** 어떤 비즈니스 로직도, 어떤 플랫폼 API도 모른다.
`next/*`·`react-dom`·`window`·`document`·Tailwind className 금지.

| 세그먼트 | 용도 |
|---|---|
| `api` | http client(mutator), 공용 queryClient 설정, Orval 생성물 |
| `lib` | 공용 유틸 (포맷터, 헬퍼, 범용 훅) |
| `config` | 상수, 환경값, **디자인 토큰(theme.ts)** |
| `types` | 공용 타입 |

> 웹 전용 디자인 시스템(`ui`)은 여기가 아니라 `apps/web/src/shared/ui`에 있다.
