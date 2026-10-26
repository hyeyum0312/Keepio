# ADR-001: v0.3 스펙(docs/spec)을 원본으로 삼고 이전 기획 문서를 제거

- Status: accepted (2026-10-26)
- Context / problem:
  - 이전 문서(PROJECT/ARCHITECTURE/TECH_STACK/STYLING)는 "AI 자동 분류 + 중첩 컬렉션 + 비교/결정" 앱, Spring Boot 백엔드, React Native 코드 공유를 전제로 했다.
  - v0.3 스펙(01~07)과 하네스(standards)는 N:M 카테고리, 버킷과 발행, NestJS + Prisma + BullMQ Worker, Expo 셸 + Next.js WebView를 전제로 한다.
  - 두 계열 문서가 같은 주제를 서로 다르게 설명해 원본이 불분명했다.
- Options:
  1. 01~07을 원본으로 삼고 이전 문서를 제거한다.
  2. 이전 문서를 새 스펙으로 다시 써서 원본으로 삼는다.
- Decision: 1번.
  - 01~05는 `docs/spec/`, AI 실행 프롬프트 06~07은 `docs/prompts/`.
  - PROJECT/ARCHITECTURE/TECH_STACK/STYLING은 삭제. spec에 없던 내용만 옮긴다: 프론트 구조·설치 버전 → `standards/FRONTEND.md`, 토큰 현황 → `standards/DESIGN.md`, 명령어 → `README.md`.
  - 우선순위: ADR > spec > standards. 같은 내용을 다시 쓰지 않고 원본을 링크한다.
  - **컬렉션 중첩:** 제외. 버킷은 한 단계. 중첩은 발행 범위·권한·정렬 규칙을 복잡하게 만든다. 재검토 가능.
  - **비교/결정 (이후 단계 아이디어):** 버킷 안 후보가 모이면 AI가 카테고리에 맞는 비교 화면(스펙형 / 무드형 / 일정형 / 허브형)을 고르고, 사용자가 고른 결과를 기록해 다시 본다. 발행과 충돌하지 않고 버킷 위에 얹을 수 있어 MVP 이후 재검토한다.
- Consequences / side effects:
  - spec의 API 예시·DB 테이블은 확정 계약이 아니다(REVIEW.md 8). Feature 문서와 OpenAPI로 확정한다.
  - spec을 바꾸는 결정은 ADR을 쓰고, 필요하면 spec 본문도 함께 고친다.
- Verification: `grep`으로 삭제 문서 참조와 Spring/FSD/컬렉션 등 이전 기획 용어가 남지 않았는지 확인.
- Rollback / migration: 문서 전용 변경. 이전 문서는 Git 이력(`afd3cbd`)에서 복원 가능.
