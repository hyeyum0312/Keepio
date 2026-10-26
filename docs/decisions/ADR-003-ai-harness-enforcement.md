# ADR-003: AI 협업 규칙은 문서보다 자동 게이트로 강제하고, 사람과 AI의 역할을 나눈다

- Status: accepted (2026-10-26)
- Context / problem:
  - 구현 대부분을 AI 코딩 에이전트가 맡는다. AGENTS.md·standards의 규칙은 에이전트가 읽어야만 지켜지고, 읽어도 어길 수 있다. "테스트 통과"도 실행 없이 주장될 수 있다.
  - keepio는 실제 출시 제품이자 포트폴리오다. 결과물을 믿을 근거와, 그 근거를 보여줄 기록이 함께 필요하다.
- Options:
  1. 규칙 문서를 더 자세히 쓴다.
  2. 규칙을 가능한 한 실행 가능한 게이트로 옮기고, 문서는 게이트가 못 잡는 판단만 남긴다.
- Decision: 2번.
  - 게이트 계층: Claude Code 편집 훅(Prettier·ESLint, 즉시 피드백) → git pre-commit(HISTORY·staged 포맷) → `npm run verify`(완료 판정) → CI(최종, 원격 연결 후 활성화).
  - 린트로 강제: feature 경계, 파일·폴더명, 색상 리터럴(`apps/web/eslint.config.mjs`). 문서에는 `(lint)`로 표시한다.
  - 작업 절차는 명령으로: `/task` → `/feature` → 구현 → `/finish`(`.claude/skills/`).
  - 게이트를 추가할 때는 위반 예제로 실패하는지 먼저 확인한다(조용히 통과하는 게이트 방지).
  - AI 실수·환경 함정은 `docs/qa/AI-LOG.md`에 기록하고, 가능하면 게이트로 전환한다.
  - **역할 분담:** AI는 구현·테스트 코드·문서 초안·대안 비교를 맡는다. 사람은 다음을 직접 결정하고 검토한다.
    - 제품 정책과 OPEN-QUESTIONS 결정
    - 테스트할 시나리오 선정(특히 spec 05의 핵심 사례 1~5)
    - 아키텍처 트레이드오프 선택(ADR 승인)
    - 보안·인증·권한, 마이그레이션·삭제 실행, 비용 한도, 법·스토어 대응
    - 커밋 전 diff 리뷰
- Consequences / side effects:
  - 초기 설정 비용이 든다. 게이트가 느리면 흐름이 끊기므로 편집 훅은 파일 하나만, 전체 검사는 verify·CI로 나눈다.
  - 로컬 hook은 `--no-verify`로 우회 가능하다. CI가 활성화되기 전까지는 최종 기준이 로컬 verify다.
  - 린트로 못 잡는 영역(Tailwind 팔레트 유틸리티, 간격·z-index, 서버 권위 값 재계산 등)은 리뷰에 남는다.
- Verification: 각 게이트의 위반 예제 차단 결과는 `docs/HISTORY.md`의 해당 커밋 항목에 기록.
- Rollback / migration: 설정 파일 단위로 revert. git hook은 `git config --unset core.hooksPath`.
