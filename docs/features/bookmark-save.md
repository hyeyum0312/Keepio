# FEAT-001 — 링크 저장: URL 정규화와 중복 방지

- Status: Draft
- Updated: 2026-10-28
- Related: PRD(01) 핵심 기능·비즈니스 규칙(44행), DB/API(04) bookmarks·부분 UNIQUE 인덱스·URL 정책·`POST /api/bookmarks`, spec 03 핵심 과제 1, spec 05 포트폴리오 사례 1, QUALITY Must-cover 1, OPEN-QUESTIONS D-01·D-04·D-11

## 목적 및 비범위

- 사용자 문제: 같은 링크를 여러 번 공유해도 하나로 모여야 하고, 동시에 저장 요청이 와도 중복이 생기지 않아야 한다.
- 이번 작업에서 하지 않는 것: 메타데이터 수집(제목·썸네일, SSRF 방어 포함), Outbox·AI 분류, 목록 조회 UI, 수정·삭제·복구 API, 버킷 연결(PRD "새 버킷 지정 시 기존 북마크 연결"은 버킷 기능에서), 실제 인증(D-04).

## 사용자 흐름 및 수용 기준

- [ ] AC-01 정상 흐름: 처음 저장하는 URL이면 북마크를 만들고 `201`과 ID를 반환한다.
- [ ] AC-02 중복: 같은 사용자가 정규화 결과가 같은 URL을 다시 저장하면 새로 만들지 않고 기존 ID를 `200`으로 반환한다.
- [ ] AC-03 동시성: 같은 사용자의 같은 URL 저장 요청 100개를 동시에 보내도 활성 북마크는 1개이고 모든 응답의 ID가 같다.
- [ ] AC-04 사용자 격리: 다른 사용자가 같은 URL을 저장하면 각자 별도 북마크가 생긴다.
- [ ] AC-05 정규화: 스킴·호스트 대소문자, 기본 포트(`:80`/`:443`), 알려진 추적 파라미터(목록 미확정)만 정리한다. 경로·그 외 쿼리·fragment는 유지한다.
- [ ] AC-06 입력 거부: `http`/`https`가 아닌 스킴, 파싱 불가 URL, 길이 상한(값 미확정) 초과는 `400`과 오류 코드로 거부하고 저장하지 않는다.
- [ ] AC-07 삭제된 URL 재저장: **D-01 결정 필요** (아래 미확정).

## 데이터 계약

- 서버 소유 값: 북마크 ID, `normalized_url`, 신규/기존 여부, `created_at`.
- 프론트 전용 파생 값: 없음.
- API 요청/응답/오류 (형태 미확정, OpenAPI로 확정):
  - `POST /api/bookmarks` body `{ url: string }`
  - 신규 `201 { id, url, normalizedUrl, createdAt }`, 기존 `200` 같은 형태. 신규/기존 구분 방식(상태 코드만 vs 필드 추가) 미확정.
  - `400 { code: "INVALID_URL" | "UNSUPPORTED_SCHEME" | "URL_TOO_LONG" }` (오류 공통 형태는 미확정)
- DB 변경/마이그레이션:
  - `users`(최소 컬럼, 인증 기능에서 확장), `bookmarks(id, user_id, original_url, normalized_url, created_at, updated_at, deleted_at)`. 제목·설명·썸네일·분류 상태는 해당 기능에서 추가.
  - 부분 UNIQUE `bookmarks(user_id, normalized_url) WHERE deleted_at IS NULL` — Prisma로 표현이 어려워 SQL 마이그레이션.
  - 충돌 처리 방식(`INSERT … ON CONFLICT` vs 예외 후 재조회) 구현 계획에서 결정.

## UX 및 디자인

- 이번 범위는 API만. 저장 결과 UI는 공유 수신·목록 기능에서.

## 영향도 및 주의사항

- 기존 Feature 및 회귀 위험: 첫 도메인 기능. `/health`·통합 테스트 환경에 영향 없음.
- 캐시/호출 빈도/무효화: 캐시 없음.
- 메모리/동시성/비용/보안: 동시성은 DB 유니크 인덱스가 권위(앱 레벨 락 금지). 사용자 식별은 D-11 임시 Guard — 운영 환경에서 반드시 거부. URL을 로그에 남길 때 쿼리 값 마스킹.
- 롤백 및 데이터 호환성: 새 테이블 생성 마이그레이션의 down 경로(테이블 drop) 명시. 운영 데이터 없음.

## 테스트 계획

테스트 이름은 `AC-xx: 동작 문장` 형식으로 수용 기준과 연결한다.

- Unit: URL 정규화 함수(AC-05 케이스 표), 입력 검증(AC-06).
- Integration (`*.int.test.ts`, 실제 PostgreSQL): AC-01, 02, 03(동시 100회), 04, 07.
- E2E: 없음(UI 범위 밖).
- Regression: `/health` 통합 테스트 유지.

## 미확정 (승인 전 결정 필요)

1. **D-01** 삭제된 URL 재저장: (a) 기존 북마크 복구 후 기존 ID 반환 (b) 새 북마크 생성 (c) 저장하지 않고 "복구할까요?" 응답(`409` + 기존 ID). spec 04 권장은 "사용자에게 복구 안내" → (c)에 가까움.
2. **D-11** 인증 전 사용자 식별: 임시 Guard 방식 승인 여부.
3. 추적 파라미터 목록(예: `utm_*`, `fbclid`, `gclid`)과 URL 길이 상한.
4. 신규/기존 구분 응답 방식.

## 구현 결과 (검증 후)

- 변경 파일/PR:
- 실행 명령 및 실제 결과:
- 남은 위험:
