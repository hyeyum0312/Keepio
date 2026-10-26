# keepio Development History

> 단일 파일·최신순 누적. 실제 변경의 원본은 Git이다. 이 파일에는 변경 이유·영향·검증 결과만 기록한다.
> 실제로 실행하지 않은 검증은 통과로 기록하지 않는다. 형식: `docs/standards/HISTORY.md`.

<!-- 새 기록은 이 주석 바로 아래, 기존 기록 위에 추가한다. -->

## 2026-10-26 | docs: v0.3 스펙과 AI 하네스로 문서 체계 재정비
- Feature: N/A
- 목적: 이전 기획(Spring/FSD/중첩 컬렉션)과 v0.3 스펙이 공존해 원본이 불분명했다. 스펙 원본과 AI 작업 규칙을 하나로 정한다(ADR-001).
- 변경: `docs/spec`(01~05), `docs/prompts`(06~07), `docs/standards`, ADR-001/002, Feature·Task 템플릿, OPEN-QUESTIONS, QA·HISTORY 문서, `scripts/check-history.py`, CI 예시 추가. PROJECT/ARCHITECTURE/TECH_STACK/STYLING 삭제. AGENTS/CLAUDE/README 갱신, globals.css 주석 참조 수정.
- 영향: 문서 전용. 코드 동작 변경 없음(CSS 주석 1줄).
- 검증: `python3 scripts/check-history.py` 실행. lint/test/build 미실행(코드 변경 없음).
- 주의/롤백: 삭제한 이전 문서는 `afd3cbd`에서 복원 가능. ADR-002의 폴더 정리는 아직 미반영.
