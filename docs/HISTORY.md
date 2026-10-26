# keepio Development History

> 단일 파일·최신순 누적. 실제 변경의 원본은 Git이다. 이 파일에는 변경 이유·영향·검증 결과만 기록한다.
> 실제로 실행하지 않은 검증은 통과로 기록하지 않는다. 형식: `docs/standards/HISTORY.md`.

<!-- 새 기록은 이 주석 바로 아래, 기존 기록 위에 추가한다. -->

## 2026-10-26 | chore: 작업 프로토콜 슬래시 명령 /task·/feature·/finish
- Feature: N/A
- 목적: AGENTS.md의 "계획 → 승인 → 구현 → 검증 → HISTORY → 커밋" 흐름을 매번 지시하지 않고 명령 하나로 재현한다.
- 변경: `.claude/skills/{task,feature,finish}/SKILL.md` 추가(사용자 호출 전용, 단계별 허용 도구 제한: /task 읽기 전용, /feature는 docs/features만 수정, /finish는 verify·build·docs 수정만 자동 허용하고 git add/commit은 확인 필요). AGENTS·README에 흐름 명시.
- 영향: 개발 도구·문서만.
- 검증: `npm run verify` PASS(3/3). 이 커밋은 /finish 절차(범위 확인 → verify → HISTORY → 커밋)를 수동으로 따라 작성. 명령 자체의 실행은 미실행(새 세션에서 스킬 목록이 로드된 뒤 확인 필요).
- 주의/롤백: 명령 정의는 프롬프트라 결과가 매번 같지 않을 수 있다. 실제 사용에서 어긋난 점은 SKILL.md에 반영한다. revert로 롤백.

## 2026-10-26 | chore: Claude Code 편집 훅·권한 허용 목록·git pre-commit 연결
- Feature: N/A
- 목적: AI가 파일을 고치는 즉시 포맷·린트 피드백을 받고, 커밋 시 HISTORY·포맷 검사가 자동으로 돌게 해 문서 규칙 의존을 줄인다.
- 변경: `.claude/settings.json`(PostToolUse Edit|Write|MultiEdit 훅, verify/lint/typecheck/test/format/build·git 조회·check-history 허용), `.claude/hooks/post-edit.sh`(편집 파일 1개 Prettier, apps/web ts/tsx/mjs ESLint 위반 시 exit 2로 피드백), `.githooks/pre-commit`(check-history + staged Prettier 검사), 루트 `prepare`로 `core.hooksPath` 설정. AGENTS/QUALITY/README에 자동 게이트 명시.
- 영향: 개발 도구만. 런타임 코드 변경 없음. 클론 후 `npm install` 시 git hook 경로가 바뀐다.
- 검증: 훅 스크립트 pipe-test — 정상 파일 exit 0, 색상 리터럴 파일은 포맷 수정 + ESLint error로 exit 2, 저장소 밖 파일 무시. 세션 내 실제 Edit로 공백을 넣어 훅이 자동 복원(diff 0) 확인. HISTORY 없는 커밋이 pre-commit에서 차단됨을 확인. 포맷이 틀린 임시 파일을 stage한 커밋도 차단됨을 확인 후 제거. `npm run verify` PASS.
- 주의/롤백: 한글 경로에서 ESLint 절대경로가 "outside of base path"로 무시되는 문제가 있어 apps/web 기준 상대경로로 전달. hook은 `--no-verify`로 우회 가능하므로 CI가 최종 기준. 롤백: revert 후 `git config --unset core.hooksPath`.

## 2026-10-26 | chore(lint): 문서 규칙을 ESLint로 강제 (feature 경계·네이밍·색상)
- Feature: N/A
- 목적: AGENTS/FRONTEND/DESIGN의 규칙을 문서 요청이 아니라 기계적 게이트로 바꿔 AI·사람의 위반을 verify에서 차단한다.
- 변경: `apps/web/eslint.config.mjs`에 (1) `@/features/<x>/<내부>` import·feature 밖 `../../` 상대 경로·shared→features import 금지(no-restricted-imports) (2) features/shared의 tsx PascalCase, `use*.ts` camelCase, 나머지 ts kebab-case, 폴더 kebab-case(eslint-plugin-check-file 3.3.2 추가) (3) hex/rgb/hsl/oklch 리터럴과 Tailwind 임의 색상 금지(no-restricted-syntax). AGENTS에 lint 강제 표시와 eslint-disable 우회 금지 추가, FRONTEND/DESIGN에 강제 범위와 미강제 범위 명시.
- 영향: 개발 도구만. 현재 코드에 위반 없음.
- 검증: 임시 probe 파일로 위반 9건(폴더명, ts·tsx 파일명, 내부 import, 상대 경로 탈출, shared→feature, 색상 리터럴 3종) 모두 error 확인, 규칙 준수 파일(useProbe.ts, format-label.ts, ProbeCard.tsx/.test.tsx, index import)은 통과 확인 후 probe 삭제. `npm run verify` PASS(3/3).
- 주의/롤백: Tailwind 팔레트 유틸리티(`text-red-500`), 간격/반경/z-index, CSS 파일, `app/` 폴더명은 미강제. feature 내부 2단계 이상 중첩 폴더에서는 `../../`가 막히므로 필요 시 규칙 조정. revert로 롤백.

## 2026-10-26 | refactor: ADR-002 반영 — packages/core와 FSD 폴더 제거
- Feature: N/A
- 목적: ADR-002 결정(기능 단위 구조, RN 공유용 core 제거)을 코드에 반영해 문서와 구조를 일치시킨다. 다음 단계의 import 경계 린트가 이 구조를 기준으로 한다.
- 변경: `packages/core`(theme.ts 포함), `apps/web/src/{views,widgets,shared/ui}` 삭제. web의 core 의존성·tsconfig paths·transpilePackages 제거, page.tsx의 core import 확인 코드 제거. features/shared README를 FRONTEND.md 참조로 교체. globals.css를 토큰 원본으로 명시, layout 설명을 v0.3 태그라인으로 갱신. 루트 workspaces의 `packages/*`는 spec 03의 향후 패키지용으로 유지.
- 영향: 웹 화면 변화 없음(빈 페이지, sr-only 텍스트 유지). 토큰 값 변화 없음.
- 검증: `npm run verify` PASS(format:check, lint/typecheck/test 3/3). `npm run build` PASS(`/`, `/_not-found` 정적 생성). allow-scripts 보류 상태에서도 빌드 성공 확인.
- 주의/롤백: 삭제 파일은 이 커밋의 부모에서 복원 가능. revert로 롤백.

## 2026-10-26 | style: Prettier 일괄 적용
- Feature: N/A
- 목적: 이후 diff에 서식 변경이 섞이지 않도록 기존 파일을 한 번에 정렬한다.
- 변경: 27개 파일(문서 표 정렬·JSON 예시 공백, globals.css, turbo.json, CI 예시). 의미 변경 없음. HISTORY.md는 불변 규칙 때문에 포맷 대상에서 제외.
- 영향: 서식만. `git blame` 시 이 커밋은 건너뛰어도 된다.
- 검증: `npm run verify` PASS(format:check 통과, turbo lint/typecheck/test 4/4).
- 주의/롤백: revert로 롤백. 추후 `.git-blame-ignore-revs`에 등록 고려.

## 2026-10-26 | chore: verify 단일 완료 게이트와 Prettier 도입
- Feature: N/A
- 목적: AI·사람·CI가 같은 명령 하나로 완료를 판정하게 한다. 문서 규칙("검증 후 보고")을 실행 가능한 게이트로 바꾸는 첫 단계.
- 변경: 루트 `verify`(format:check → turbo lint/typecheck/test), `typecheck`, `format`, `format:check` 스크립트. web `typecheck`(next typegen + tsc), core `typecheck`. turbo `typecheck` 태스크. Prettier + tailwind 클래스 정렬 플러그인 설정. CI 예시를 verify 기준으로 수정. AGENTS/QUALITY/README에 verify 명시.
- 영향: 개발 도구만. 런타임 코드 변경 없음. 기존 파일 재포맷은 다음 커밋에서 분리.
- 검증: `npx turbo run lint typecheck test` PASS(4/4, web 테스트 1개). 타입 오류 파일을 임시로 넣어 typecheck 실패(TS2322) 확인 후 제거. `npm run verify`는 재포맷 전이라 format:check 실패가 예상되어 다음 커밋에서 실행.
- 주의/롤백: `npm install` 시 sharp·unrs-resolver 등 install script가 npm allow-scripts 정책으로 보류됨(현재 검사는 영향 없음, 빌드 시 확인 필요). revert로 롤백.

## 2026-10-26 | docs: v0.3 스펙과 AI 하네스로 문서 체계 재정비
- Feature: N/A
- 목적: 이전 기획(Spring/FSD/중첩 컬렉션)과 v0.3 스펙이 공존해 원본이 불분명했다. 스펙 원본과 AI 작업 규칙을 하나로 정한다(ADR-001).
- 변경: `docs/spec`(01~05), `docs/prompts`(06~07), `docs/standards`, ADR-001/002, Feature·Task 템플릿, OPEN-QUESTIONS, QA·HISTORY 문서, `scripts/check-history.py`, CI 예시 추가. PROJECT/ARCHITECTURE/TECH_STACK/STYLING 삭제. AGENTS/CLAUDE/README 갱신, globals.css 주석 참조 수정.
- 영향: 문서 전용. 코드 동작 변경 없음(CSS 주석 1줄).
- 검증: `python3 scripts/check-history.py` 실행. lint/test/build 미실행(코드 변경 없음).
- 주의/롤백: 삭제한 이전 문서는 `afd3cbd`에서 복원 가능. ADR-002의 폴더 정리는 아직 미반영.
