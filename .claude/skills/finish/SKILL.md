---
name: finish
description: 검증을 실행하고 HISTORY 항목과 커밋 메시지 초안을 만든 뒤, 승인되면 커밋한다.
argument-hint: "[커밋 범위 메모]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(docs/**), Bash(npm run verify), Bash(npm run build), Bash(git status *), Bash(git diff *), Bash(git log *), Bash(python3 scripts/check-history.py *)
---

# /finish — 검증 · 기록 · 커밋

메모: $ARGUMENTS

1. `git status`, `git diff --stat`으로 범위를 확인한다. 무관한 변경이 섞였으면 멈추고 분리 방법을 묻는다.
2. `npm run verify`를 **한 번** 실행한다(통과한 검증을 코드 변경 없이 반복하지 않는다). 빌드 설정·라우트·의존성이 바뀌었으면 `npm run build`도 실행한다. 실패하면 여기서 멈추고 원인을 보고한다. 검증을 약화하지 않는다.
3. 관련 Feature 문서가 있으면 "구현 결과"에 실제 실행 명령과 결과를 채우고, 수용 기준이 모두 검증됐을 때만 Status를 `Implemented`로 바꾼다.
4. `docs/HISTORY.md` 마커 바로 아래에 `docs/standards/HISTORY.md` 형식으로 항목 하나를 추가한다. 검증 칸에는 **이번에 실제로 실행한** 명령과 결과만 쓴다. 실행하지 않은 것은 `미실행(사유)`.
5. 이번 작업 중 게이트가 잡은 위반, 고친 AI 실수, 환경 함정이 있었으면 `docs/qa/AI-LOG.md`에 한 줄 추가한다. Feature 완료면 기능별 지표 행도 측정한 값으로 추가한다.
6. Conventional Commit 메시지 초안(제목 + 요약 2~4줄 + 대화에서 지정된 attribution)과 HISTORY 항목을 보여주고 승인을 기다린다.
7. 승인되면 `git add`(관련 파일만) → `git commit`. pre-commit이 실패하면 원인을 고쳐 다시 커밋하고, `--no-verify`는 쓰지 않는다.
8. 보고: 커밋 해시, 실행한 검증과 결과, 남은 위험, 롤백 방법.
