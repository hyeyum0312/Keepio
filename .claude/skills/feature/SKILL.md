---
name: feature
description: FEATURE-TEMPLATE으로 기능 명세(docs/features/<name>.md) 초안을 만든다. 구현은 하지 않는다.
argument-hint: <kebab-case 기능명> [설명]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(docs/features/**)
---

# /feature — 기능 명세 초안

입력: $ARGUMENTS

1. `docs/features/README.md`와 기존 `docs/features/*.md`를 확인한다. 같은 기능 문서가 있으면 새로 만들지 않고 수정안을 제시한다.
2. ID는 기존 최대 `FEAT-###` + 1. 파일명은 `docs/features/<kebab-case>.md`.
3. `docs/features/FEATURE-TEMPLATE.md`를 그대로 따른다. 근거는 `docs/spec/01-PRD.md`, `04-DATABASE-API.md` 등 해당 절과 ADR에서 가져오고, `Related`에 출처를 적는다.
4. spec에 없는 내용은 지어내지 않는다. 비워 두고 `미확정`으로 표시하고, `docs/OPEN-QUESTIONS.md`의 관련 D-xx를 링크한다. 새 미결정이면 추가할 행을 제안만 한다.
5. 수용 기준은 테스트로 검증 가능한 문장으로 쓴다. `docs/standards/QUALITY.md`의 Must-cover 시나리오 중 해당하는 것을 테스트 계획에 넣는다.
6. Status는 `Draft`. "구현 결과" 절은 비워 둔다.
7. 보고: 파일 경로, 사용자가 결정해야 할 미확정 항목 목록. "승인되면 Status를 Approved로 바꾸고 `/task`로 구현 계획을 세웁니다."
