# keepio Development History

> 단일 파일·최신순 누적. 실제 변경의 원본은 Git이다. 이 파일에는 변경 이유·영향·검증 결과만 기록한다.
> 실제로 실행하지 않은 검증은 통과로 기록하지 않는다. 형식: `docs/standards/HISTORY.md`.

<!-- 새 기록은 이 주석 바로 아래, 기존 기록 위에 추가한다. -->

## 2026-10-26 | chore(api): NestJS 12 앱 뼈대와 Vitest·ESLint 게이트
- Feature: N/A
- 목적: Phase 0 "NestJS + PostgreSQL 프로젝트 구성"의 1단계. DB 없이 실행·검증 가능한 API 기반을 만들고 기존 게이트(verify, 편집 훅, pre-commit)에 편입한다.
- 변경: `apps/api`(`@keepio/api`, ESM) — `GET /health`, `/docs` OpenAPI, 전역 ValidationPipe(whitelist·forbidNonWhitelisted·transform), `WEB_ORIGIN` 설정 시에만 CORS, `enableShutdownHooks`. Vitest + unplugin-swc, typescript-eslint + 테스트 규칙 + kebab-case 파일·폴더. 편집 훅·pre-commit을 web/api 공통으로 확장. turbo build outputs에 `dist/**`, `.gitignore`·`.prettierignore`에 dist. 루트 `overrides.multer 2.5.0`. ADR-004, AGENTS·README·QUALITY 반영.
- 영향: 신규 패키지만, web 동작 변화 없음. 공유 devDependency 호이스팅으로 typescript-eslint 8.61.1 → 8.71.2, eslint 9.39.4 → 9.39.5(web lint 통과 확인). 기본 포트 3001.
- 검증: `npm run verify` PASS(6/6), `npm run build` PASS(2/2), `npm audit` 0건. api 테스트 2개(health 200, OpenAPI에 /health 포함) PASS. `nest build` 후 기동해 `/health` 200 `{"status":"ok"}`, `/docs` 200, 미존재 경로 404 확인. 편집 훅 pipe-test — api 파일명 위반·`it.only` exit 2, 정상 파일 exit 0. 새 의존성은 배포 7일 이상 버전으로 선택(예외: 보안 수정 multer 2.5.0, 4일).
- 주의/롤백: Nest 12.2.0이 multer 2.4.0(GHSA-q7qp-rjg7-q26m)을 고정해 override 사용, Nest 업데이트 시 제거 검토. `@swc/core` postinstall 보류 상태로 동작 확인. DB·Prisma·통합 테스트·CI 활성화는 다음 커밋(OrbStack 설치 필요). revert로 롤백.

## 2026-10-26 | fix(security): Node 24.22.1 고정, next 16.4.3 및 의존성 취약점 해소
- Feature: N/A
- 목적: apps/api 착수 전 런타임·의존성 보안 기준선을 맞춘다. 2026-10-21 Node.js 보안 릴리스(CVE-2026-111497 Brotli 디코더 OOB write로 RCE, TLS 호스트명 검증·dns NUL 처리 등 10건)가 로컬 v24.19.0에 해당했고, `npm audit`에서 next critical 포함 15건이 나왔다.
- 변경: `.nvmrc`(24.22.1), 루트 `engines.node >=24.22.1 <25`, `.npmrc` `engine-strict=true`. web `next`·`eslint-config-next` 16.2.9 → 16.4.3(exact), `npm audit fix`(--force 없음, major 변경 없음). CI 예시는 `node-version-file: .nvmrc`. 편집 훅 Prettier에 저장소 기준 상대경로를 넘기도록 수정.
- 영향: 웹 런타임 마이너 업그레이드. 이 저장소에서 Node 24.22.1 미만이면 `npm install/ci`가 EBADENGINE으로 실패한다(의도). 회사 등 다른 프로젝트는 nvm으로 별도 버전 유지.
- 검증: `npm audit` 0건. `npm run verify` PASS(3/3), `npm run build` PASS(Node 24.22.1). `npm ci --dry-run`이 24.19.0에서 EBADENGINE 차단, 24.22.1에서 통과 확인. Shai-Hulud/ChainDrop(keyv·flat-cache 등) Wiz IOC 목록 446개와 lockfile 대조 결과 악성 버전 0건, 공개된 파일 IOC(`.claude/setup.mjs`, `.vscode/setup.mjs`, `Math_Symbol.js` 등)·전역 Claude 훅 없음. 훅 수정 전 HISTORY 편집 시 Prettier가 기존 기록을 재포맷해 `check-history.py`가 차단, 수정 후 같은 편집은 추가분만 남음을 확인.
- 주의/롤백: `packageManager`가 `npm@10.9.0`인데 실제는 11.19.1이라 Corepack 사용 시 npm 10(allow-scripts 정책 없음)이 쓰일 수 있다(미조치, AI-LOG 기록). fsevents·unrs-resolver install script는 계속 보류 상태. revert 후 `npm ci`로 롤백.

## 2026-10-26 | chore(test): 테스트 실행 시점·작성 규칙과 토큰 절약 게이트
- Feature: N/A
- 목적: 언제 어떤 테스트를 돌릴지와 작성 규칙을 정하고, AI 컨텍스트에 들어가는 검증 출력을 최소화한다.
- 변경: QUALITY.md에 실행 시점 표·토큰 원칙·작성 규칙 추가. web `test:related`(vitest related, dot reporter, 실패 로그만). verify에 turbo `--output-logs=errors-only`. pre-commit에 staged 관련 테스트 추가, 통과 시 무출력·실패 시 마지막 40줄. `@vitest/eslint-plugin` ~1.5.4로 `.only`/`.skip`/assertion 없는 테스트/중복 제목 금지. AGENTS·FEATURE-TEMPLATE·/finish에 반영. Stop 훅은 토큰 비용 때문에 도입하지 않음.
- 영향: 개발 도구·문서만.
- 검증: probe 테스트로 lint 3건(.only, .skip, expect 없음) error 확인. 실패 테스트를 stage한 커밋이 pre-commit에서 차단(약 1.3초), 통과 시 pre-commit 출력 0바이트 확인 후 probe 삭제. `npm run verify` PASS(3/3).
- 주의/롤백: 플러그인 1.6.x는 TS6 필요(AI-LOG 기록). 관련 테스트가 30초를 넘으면 pre-push로 이동. revert로 롤백.

## 2026-10-26 | docs: AI 협업 하네스 결정(ADR-003)·AI-LOG·포트폴리오 사례 6 추가
- Feature: N/A
- 목적: 오늘 구축한 하네스의 결정 이유와 실제 사례를 기억이 생생할 때 남겨, 출시 품질 근거이자 포트폴리오 증거로 쓴다.
- 변경: ADR-003(게이트 계층, 사람/AI 역할 분담), `docs/qa/AI-LOG.md`(오늘 실제 발생한 5건 + 기능별 지표 표), spec 05 포트폴리오 핵심 사례 6 추가, docs/README·AGENTS에 AI-LOG 기록 규칙, `/finish`에 AI-LOG 기록 단계 추가.
- 영향: 문서·스킬 정의만. spec 05는 사례 목록 1줄 추가(기존 내용 변경 없음).
- 검증: `npm run verify` PASS(3/3). AI-LOG 항목은 이 세션의 HISTORY 기록과 대조해 실제 발생한 것만 기재.
- 주의/롤백: AI-LOG는 기록이 쌓여야 가치가 있다. 지표는 측정값만 기재. revert로 롤백.

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
