# ADR-010: PR은 목적 단위로 묶고, 배포 전에는 승격하지 않는다

- Status: accepted (2026-10-30)
- Context / problem:
  - ADR-007 이후 작은 정리마다 작업 브랜치·PR을 따로 열어 하루에 PR 4개(#19~#22)를 merge했다. 사용자가 merge를 매번 하는 부담이 크고, 동시에 열린 PR끼리 HISTORY 맨 위 항목이 충돌했다(#21·#22).
  - 배포 환경이 없어(D-12 보류) `dev`→`stg`→`prod` 승격 PR은 CI 검증 말고 하는 일이 없다.
- Options:
  - (a) 목적 단위로 묶은 PR + 배포 전 승격 중단
  - (b) `dev`에 PR 없이 직접 push — CI가 `pull_request`에서만 돌아 merge 전 검사가 사라지고, 로컬 hook은 우회 가능해 대체가 안 된다
  - (c) AI가 PR 생성 시 auto-merge 예약 — "AI는 merge하지 않는다" 규칙과 충돌, 사용자 확인 단계가 없어진다
- Decision: (a) (사용자 결정). 작업 브랜치 → `dev` PR과 CI 필수는 유지한다. 규칙: `BRANCHING.md` 10번, 환경.
- Consequences / side effects:
  - PR 하나가 커진다. squash merge 후 `dev`에는 커밋 1개지만 HISTORY에는 커밋별 항목이 남는다.
  - `stg`는 `dev`보다 뒤처진 채로 둔다. 승격을 다시 시작할 때 한 번에 따라잡는다.
- Verification: 이후 PR 수와 HISTORY 충돌 빈도를 보고 재검토한다.
- Rollback / migration: 문서 revert. 브랜치·보호 규칙·CI는 바꾸지 않았다.
