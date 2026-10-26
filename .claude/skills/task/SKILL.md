---
name: task
description: 요청을 TASK-TEMPLATE 형식의 계획으로 정리하고 승인을 기다린다. 코드는 수정하지 않는다.
argument-hint: <작업 요청>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git status *), Bash(git log *), Bash(git diff *)
---

# /task — 계획 먼저

요청: $ARGUMENTS

1. `AGENTS.md`의 우선순위대로 **관련 문서만** 찾는다. 대상 영역 standards 1~2개, 해당 spec 절, 관련 ADR·Feature, `docs/OPEN-QUESTIONS.md`에서 걸리는 항목, `docs/HISTORY.md` 최근 3개 항목. 전체 문서를 읽지 않는다.
2. 관련 코드와 기존 테스트를 확인한다. 추측한 API·규칙은 "미확정"으로 표시한다.
3. `docs/plans/TASK-TEMPLATE.md`의 항목(완료 보고 제외)을 채워 **응답으로** 보고한다. 파일로 저장하지 않는다.
4. 함께 판단해 적는다:
   - 새 사용자 행동/계약 변경이면 "Feature 문서 필요 → `/feature`", 리팩터링이면 "불필요".
   - 미결정 사항(D-xx)에 막히면 막히는 지점과 선택지를 적는다.
   - 큰 변경이면 커밋 단위로 쪼갠다.
5. 마지막 줄: "승인하면 구현합니다." 승인 전에는 파일을 수정하지 않는다.
