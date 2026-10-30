# ADR-008: spec·standards를 최종 상태로 두고, ADR은 결정 변경의 이유만 기록

- Status: accepted (2026-10-30, 사용자 결정)
- Context / problem:
  - ADR-001의 우선순위(ADR > spec > standards)에서는 현재 규칙을 알려면 spec과 관련 ADR을 모두 확인해야 한다. ADR이 쌓일수록 읽을 양이 늘고, 번복된 결정과 현재 결정이 섞인다.
  - 확인 시점에 ADR-004(Vitest·class-validator)와 ADR-001(버킷 중첩 제외·비교/결정 보류)이 spec에 반영되지 않은 상태였다.
- Options:
  1. 현행 유지, ADR 목록표로 탐색 비용을 줄인다.
  2. spec·standards를 최종 상태로 두고 결정이 바뀔 때 함께 고친다. ADR은 이유 기록.
- Decision: 2번. ADR-001의 우선순위 문구와 ADR-004의 "이 ADR이 우선" 문구를 대체한다(기존 ADR 본문은 고치지 않는다).
  - 결정을 바꾸는 변경은 같은 PR에서 spec·standards 본문과 ADR을 함께 고친다.
  - 에이전트는 spec·standards만으로 현재 규칙을 판단하고, ADR은 이유가 필요할 때만 읽는다.
  - 이번에 반영: spec 03 검증·테스트 도구, PRD "MVP 제외"에 버킷 중첩·비교/결정 화면.
- Consequences / side effects:
  - 결정 변경 때마다 spec 수정 비용이 생긴다. 빠뜨리면 spec이 낡으므로 리뷰에서 확인한다.
- Verification: ADR-001~007의 결정이 spec·standards에 반영됐는지 대조(002·003·005·006·007은 반영 확인, 001·004는 이번에 반영).
- Rollback / migration: AGENTS.md·docs/README.md 우선순위 문구를 되돌린다.
