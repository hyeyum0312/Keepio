# FEAT-001 — 링크 저장: URL 정규화와 중복 방지

- Status: Approved
- Updated: 2026-10-30 (추적 파라미터·길이 상한·응답 구분·오류 문구 확정)
- Related: PRD(01) 핵심 기능·비즈니스 규칙(44행), DB/API(04) bookmarks·부분 UNIQUE 인덱스·URL 정책·`POST /api/bookmarks`, spec 03 핵심 과제 1, spec 05 포트폴리오 사례 1, QUALITY Must-cover 1, OPEN-QUESTIONS D-01·D-04·D-11

## 목적 및 비범위

- 사용자 문제: 같은 링크를 여러 번 공유해도 하나로 모여야 하고, 동시에 저장 요청이 와도 중복이 생기지 않아야 한다.
- 이번 작업에서 하지 않는 것: 메타데이터 수집(제목·썸네일, SSRF 방어 포함), Outbox·AI 분류, 목록 조회 UI, 수정·삭제·복구 API, 버킷 연결(PRD "새 버킷 지정 시 기존 북마크 연결"은 버킷 기능에서), 실제 인증(D-04).

## 사용자 흐름 및 수용 기준

- [ ] AC-01 정상 흐름: 처음 저장하는 URL이면 북마크를 만들고 `201`과 ID를 반환한다.
- [ ] AC-02 중복: 같은 사용자가 정규화 결과가 같은 URL을 다시 저장하면 새로 만들지 않고 기존 ID를 `200`으로 반환한다.
- [ ] AC-03 동시성: 같은 사용자의 같은 URL 저장 요청 100개를 동시에 보내도 활성 북마크는 1개이고 모든 응답의 ID가 같다.
- [ ] AC-04 사용자 격리: 다른 사용자가 같은 URL을 저장하면 각자 별도 북마크가 생긴다.
- [ ] AC-05 정규화: 스킴·호스트 소문자, 기본 포트(`http :80`/`https :443`) 제거, 추적 파라미터 `utm_source`·`utm_medium`·`utm_campaign`·`utm_term`·`utm_content`·`fbclid`·`gclid`·`igshid`(이름 정확히 일치)만 제거한다. 경로·그 외 쿼리(순서 유지)·fragment는 유지한다. 쿼리가 모두 제거되면 `?`도 없앤다.
- [ ] AC-06 입력 거부: 파싱 불가 URL(빈 문자열 포함), `http`/`https`가 아닌 스킴, 입력 또는 정규화 결과가 2048자 초과면 `400`과 오류 코드로 거부하고 저장하지 않는다. `url`이 없거나 문자열이 아니면 `400 VALIDATION_FAILED`.
- [ ] AC-07 삭제된 URL 재저장(D-01): 같은 사용자의 삭제된 북마크와 정규화 URL이 같으면 저장하지 않고 `409 { code: "BOOKMARK_DELETED", bookmarkId }`로 복구를 안내한다. 활성 북마크가 있으면 AC-02가 우선한다.

## 데이터 계약

- 서버 소유 값: 북마크 ID, `normalized_url`, 신규/기존 여부, `created_at`.
- 프론트 전용 파생 값: 없음.
- API 요청/응답/오류 (OpenAPI로 확정):
  - `POST /api/bookmarks` body `{ url: string }`
  - 신규 `201 { id, url, normalizedUrl, createdAt }`, 기존 `200` 같은 형태. 신규/기존은 상태 코드로만 구분한다(body에 별도 필드 없음).
  - 오류는 공통 형태 `{ code, message, requestId, details? }`(ADR-006). `BOOKMARK_DELETED`는 복구 대상 `bookmarkId`를 함께 준다.
- 오류 문구(ADR-009, 서버 `message` 그대로 표시):

  | status | code               | 상황                                  | 문구                                             |
  | ------ | ------------------ | ------------------------------------- | ------------------------------------------------ |
  | 400    | INVALID_URL        | 링크 주소로 읽을 수 없음(빈 값 포함)  | 올바른 링크 주소가 아니에요.                     |
  | 400    | UNSUPPORTED_SCHEME | http·https가 아닌 주소                | http나 https로 시작하는 링크만 저장할 수 있어요. |
  | 400    | URL_TOO_LONG       | 입력 또는 정규화 결과가 2048자 초과   | 링크 주소가 너무 길어요.                         |
  | 409    | BOOKMARK_DELETED   | 같은 링크를 삭제한 적 있음(복구 안내) | 삭제한 링크예요. 복구할 수 있어요.               |
  | 400    | VALIDATION_FAILED  | `url`이 없거나 문자열이 아님          | (공통) 입력한 내용을 확인해 주세요.              |

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

- 결정됨: D-01 → `409` 복구 안내(AC-07), D-11 → 개발·테스트 전용 임시 Guard.
- 결정됨(2026-10-30, 사용자):
  - 추적 파라미터는 확실한 8개만(AC-05). 의미 있는 파라미터를 지우면 다른 페이지가 한 북마크로 합쳐지고, 덜 지우면 중복 저장에 그친다. 목록을 늘리면 기존 저장분과 정규화 결과가 달라지므로 변경은 별도 결정으로 한다.
  - 길이 상한 2048자(AC-06). PostgreSQL B-tree 인덱스 항목 한계(약 2.7KB)보다 작아야 유니크 인덱스 삽입이 500으로 실패하지 않는다. 한글 경로·국제화 도메인은 정규화하며 길어질 수 있어 정규화 결과에도 적용한다.
  - 신규/기존은 `201`/`200`으로만 구분. 클라이언트(`apiFetch`)가 `status`를 돌려준다.
- 구현 계획에서 결정: 충돌 처리 방식(`INSERT … ON CONFLICT` vs 예외 후 재조회), `ApiException`에 `bookmarkId` 같은 추가 필드를 싣는 방법.

## 구현 결과 (검증 후)

- 변경 파일/PR:
- 실행 명령 및 실제 결과:
- 남은 위험:
