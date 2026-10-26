# Feature Index

새로운 **사용자 행동/비즈니스 동작** 또는 기존 계약 변경 시 기능별 파일을 만든다. 단순 스타일 수정·리팩터링에는 새 문서를 만들지 않는다.

- [템플릿](FEATURE-TEMPLATE.md)
- 구현 전 `Draft → Approved`; 검증 완료 후에만 `Implemented`로 변경
- 현재 확정되지 않은 사항은 `docs/OPEN-QUESTIONS.md`로 연결
- Feature는 기대 동작, standards는 구현 방식, ADR은 선택 이유, HISTORY는 변경 이유를 기록한다.
- 파일명 `kebab-case.md`; ID `FEAT-###`; 하나의 기능에 문서 하나를 원칙으로 한다.
