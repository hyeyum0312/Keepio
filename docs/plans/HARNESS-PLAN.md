# keepio AI 개발 하네스 구축 계획

## 구조: 짧은 규칙 + 상세 기준 + 자동화
- `AGENTS.md`: 에이전트 공통 규약(짧고 강한 규칙)
- `CLAUDE.md`: Claude 진입점, AGENTS.md 참조만 유지(복제 금지)
- `docs/standards/`: 역할별 기준(기획, 디자인, 프론트, 백엔드, QA, 운영)
- `docs/plans/`: 변경 단위 계획, 승인, 사이드이펙트
- `docs/qa/`: 테스트 케이스와 **실제** 검증 증거
- `docs/decisions/`: 오래 유지될 아키텍처 결정(ADR)
- `.github/workflows/`: 기계적으로 검증하는 CI

## 현업에서 재현성 높은 방식
단일 거대한 프롬프트보다 버전 관리되는 repo instruction + formatter/linter/typechecker + tests + CI + PR review를 조합한다. AGENTS.md/CLAUDE.md는 에이전트별 읽기 관례가 다르므로 둘 다 두되 규칙의 단일 원본을 만든다. 도구별 지원 범위는 설치 버전에서 검증한다. 문서만으로 코드 스타일·성능·보안을 보장할 수 없으므로 기계적 게이트가 필수다.

## 단계별 적용
1. **규칙 고정**: 네이밍/디자인 토큰/폴더 경계/테스트 기준/문서 우선순위 합의.
2. **코드 자동화**: ESLint, Prettier, TypeScript strict, import boundaries, Tailwind class sorting, token lint 정책 도입.
3. **테스트 자동화**: Jest/Vitest, Supertest, PostgreSQL 통합 테스트, Playwright; 회귀 케이스 축적.
4. **Git 게이트**: pre-commit에는 빠른 staged lint/format, pre-push 또는 PR CI에는 전체 typecheck/test/build. Husky/lint-staged는 선택. 로컬 hook은 우회 가능하므로 CI가 최종 기준.
5. **AI 작업 템플릿**: 변경 전에 계획·영향 분석, 변경 후 실행 증거·회귀·롤백 보고.
6. **관측 기반 최적화**: 네트워크 요청 수, heap/RSS, 큐 길이, DB 연결, AI 비용을 측정하고 병목에만 캐시 도입.

## CI 실행 정책
- PR: lint → typecheck → unit → DB integration → build. 빠른 smoke E2E는 실행 비용이 허용되면 포함.
- main: 동일 검증 + 웹 E2E/배포 전 smoke.
- 모바일: 별도 기기/시뮬레이터 워크플로(네이티브 빌드 비용 고려).
- 실패 시 merge 차단(브랜치 보호 규칙에서 필수 체크 설정). 커밋 훅만으로는 강제할 수 없다.

## 적용 주의
첨부한 CI 파일은 **예시 템플릿**이다. 실제 package manager, workspace 스크립트, 테스트 DB 준비가 확정되면 수정한 후 활성화한다. 현재 소스코드가 없으므로 어떤 테스트도 실행했다고 주장하지 않는다.
