# views — FSD `pages` 레이어

라우트 단위 **화면 조립**. widget·feature·entity를 모아 하나의 화면을 만든다.

> Next App Router의 `src/app/`과 이름이 겹치지 않도록 FSD pages 레이어를 `views`로 둔다.
> `src/app/`의 `page.tsx`는 얇게 유지하고, 실제 화면은 여기서 조립해 import 한다.

- 의존 가능: `widgets`, `features`, `entities`, `shared`
- 예시: `views/home`, `views/library`, `views/collection-detail`
