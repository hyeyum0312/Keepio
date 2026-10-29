# ADR-007: dev·stg·prod 브랜치와 PR 기반 승격

- Status: accepted (2026-10-29)
- Context / problem: main 직접 push 구조라 CI가 실패해도 코드가 들어갔다(브랜치 보호 없음). 출시 후에는 개발·QA·운영을 분리해야 한다. 혼자 개발하지만 실무 흐름을 따르고 싶다(사용자 결정).
- Options:
  1. main 단일 브랜치 + 태그 배포(trunk-based). 단순하지만 QA 환경 분리를 별도 장치로 해야 한다.
  2. dev·stg·prod 환경 브랜치 + PR 승격. 호스팅(Amplify 등)의 브랜치별 배포와 바로 맞물린다. 승격·역반영 규칙이 필요하다.
  3. 2 + 리뷰 승인 필수. 혼자서는 본인 PR을 승인할 수 없어 merge가 막힌다.
- Decision: 2. 규칙은 `docs/standards/BRANCHING.md`. 기존 main을 dev로 이름 변경(기본 브랜치), stg·prod 생성. 세 브랜치 보호: PR 필수, CI `verify` 통과 필수, 강제 push·삭제 금지, 리뷰 승인 미요구. CI는 PR·주간·수동에서만 실행(push 재실행 제거). 허용되지 않은 PR 경로는 CI가 실패시킨다. 로컬 pre-commit은 보호 브랜치 커밋을 막는다. PR merge는 사용자가 한다.
- Consequences / side effects: main 직접 push 불가. 작업마다 브랜치·PR이 필요하다. CI 실행 횟수는 PR당 1회로 줄어든다. 환경(서버·DB) 비용은 이 결정으로 생기지 않는다 — 환경은 D-12에서 dev→stg→prod 순으로 만든다. 같은 코드를 브랜치마다 다시 빌드하므로, 배포 단계에서 빌드 산출물 재사용 여부를 다시 판단한다.
- Verification: 이 변경 자체를 첫 PR(`chore/branch-strategy`→`dev`)로 올려 필수 체크 동작 확인, `dev`→`stg` PR 통과 확인, 허용되지 않은 경로 PR 실패 확인. 결과는 HISTORY에 기록.
- Rollback / migration: 보호 규칙 해제, `dev`를 main으로 이름 변경, `ci.yml` 트리거 복원.
