# keepio — 프로젝트 문서

> Save once. Curate freely. Share beautifully.

## 원본 우선순위

spec(`spec/`)과 standards(`standards/`)가 최종 상태다. 결정이 바뀌면 이 문서들을 고치고, 바꾼 이유는 ADR(`decisions/`)에 남긴다(ADR-008). 같은 내용을 여러 문서에 다시 쓰지 않고 원본을 링크한다.

## 스펙 원본 (v0.3) — `spec/`

1. [제품 기획 및 요구사항](spec/01-PRD.md)
2. [UX/UI 디자인 명세](spec/02-DESIGN.md)
3. [백엔드 아키텍처](spec/03-BACKEND-ARCHITECTURE.md)
4. [DB 및 API 설계](spec/04-DATABASE-API.md)
5. [개발 계획·테스트·포트폴리오](spec/05-ROADMAP-PORTFOLIO.md)

## 개발 환경

- [개발 환경 설정](SETUP.md): 설치할 것, 버전, 명령어, 문제 해결

## 결정과 미결정

- [ADR](decisions/): 결정 변경의 이유 기록(현재 상태는 spec·standards)
- [미결정 사항](OPEN-QUESTIONS.md)
- [스펙 검토 기록](REVIEW.md)

## 작업 규칙

- [역할별 규칙](standards/): 제품·디자인·프론트·백엔드·품질·운영·이력
- [기능 명세](features/) · [작업 계획](plans/) · [QA 기록](qa/) · [이력](HISTORY.md)
- [AI 협업 로그](qa/AI-LOG.md): AI 실수·환경 함정과 게이트 전환 기록

## 학습 노트 — `learning/`

- [01 초기 세팅 전체 구조](learning/01-initial-setup.md): 기능 구현 전 기본 세팅 스냅샷(2026-10-29)

## AI 실행 프롬프트 — `prompts/`

- [개발 AI](prompts/06-PROMPT-DEVELOPMENT.md) · [Claude Design](prompts/07-PROMPT-DESIGN.md)
