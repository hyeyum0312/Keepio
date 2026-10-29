# Branching / PR Rules

> 프로젝트 규칙. 결정 근거는 `docs/decisions/ADR-007-branch-strategy.md`.

## 브랜치

| 브랜치                                          | 역할                                    | 변경 방법                           |
| ----------------------------------------------- | --------------------------------------- | ----------------------------------- |
| `dev` (기본)                                    | 개발 통합. 배포 단계에서 자동 배포      | 작업 브랜치 PR (squash merge)       |
| `stg`                                           | QA                                      | `dev` → `stg` PR (merge commit)     |
| `prod`                                          | 운영                                    | `stg` → `prod` PR (merge commit)    |
| `feature/*` `fix/*` `chore/*` `docs/*` `test/*` | 작업 단위. `dev`에서 따고 merge 후 삭제 | 자유                                |
| `hotfix/*`                                      | 운영 긴급 수정. `prod`에서 딴다         | `hotfix/*` → `prod` PR, 이후 역반영 |

## 규칙

1. `dev`·`stg`·`prod`에는 직접 커밋·push하지 않는다. PR로만 바꾼다(GitHub 보호 규칙, pre-commit이 강제).
2. PR merge 조건은 CI(`verify`) 통과. 혼자 개발하므로 리뷰 승인은 요구하지 않는다.
3. 승격 PR(`dev`→`stg`, `stg`→`prod`)에는 새 커밋을 넣지 않는다. QA를 통과한 코드와 운영 코드가 같아야 한다. 수정이 필요하면 작업 브랜치 → `dev`부터 다시 올린다.
4. 긴급 수정: `prod`에서 `hotfix/*`를 따서 `prod`로 PR → merge 후 `prod`→`stg`, `stg`→`dev` PR로 역반영한다. 역반영을 빠뜨리지 않는다.
5. 허용 경로만 CI를 통과한다: 작업 브랜치→`dev`, `dev`→`stg`, `stg`→`prod`, `hotfix/*`→`prod`, 역반영 `prod`→`stg`·`stg`→`dev`.
6. merge 방식: 작업 브랜치→`dev`는 squash(PR 1개 = 커밋 1개). 승격·역반영은 merge commit(squash하면 브랜치 이력이 갈라진다).
7. 브랜치 이름은 kebab-case 영어: `feature/bookmark-save`, `fix/health-timeout`.
8. HISTORY 항목은 작업 브랜치 커밋에서 작성한다. 승격 PR은 그대로 가져가므로 새로 쓰지 않는다. 역반영 충돌 시 hotfix 항목을 마커 바로 아래에 둔다.

## AI 에이전트

- 작업 브랜치에서만 커밋한다. 브랜치 생성·커밋·push·PR 생성은 사용자 승인 후에 한다.
- PR merge는 사용자가 한다. AI는 merge하지 않는다.
- 검증용 PR(실패를 확인하는 PR 등)은 별도 브랜치·커밋으로 연다. 같은 커밋에 실패한 `verify`가 붙으면 실제 PR의 필수 체크가 막힌다.
- PR 본문: 목적, 변경 요약, 실제 실행한 검증, 위험·롤백. HISTORY 항목과 내용이 같으면 요약해서 링크한다.

## 환경

환경(서버·DB)은 브랜치와 별개로 단계적으로 만든다: 첫 배포 시 `dev`, QA가 필요할 때 `stg`, 출시 직전 `prod`(D-12). 브랜치만 있고 환경이 없는 기간에는 승격 PR이 CI 검증만 한다.
