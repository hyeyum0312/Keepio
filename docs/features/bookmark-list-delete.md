# FEAT-002 — 링크 목록·삭제·복구

- Status: Implemented
- Updated: 2026-11-10 (인증 도입 반영, 결정 확정, 최소 웹 화면 포함 — 사용자 결정)
- Related: PRD(01) 핵심 기능(Soft Delete·복구), 비즈니스 규칙 45·46행, DB/API(04) `GET /api/bookmarks`·`DELETE /api/bookmarks/:id`·`POST /api/bookmarks/:id/restore`, FEAT-001(AC-07 409 → 복구), QUALITY Must-cover 3·6, FEAT-003(인증, AC-17), OPEN-QUESTIONS D-01·D-07

## 목적 및 비범위

- 사용자 문제: 저장한 링크를 목록으로 보고, 필요 없으면 지우고, 실수로 지운 것은 되돌린다. FEAT-001의 409(삭제한 링크) 안내가 실제 복구로 이어진다.
- 이번 작업에서 하지 않는 것: 수정(PATCH, 사용자 결정 — 북마크 필드가 URL뿐이고 URL 변경은 삭제+저장과 같다), 검색·필터·분류 탭(분류 기능에서), 완전 삭제·보관 기간 정리(D-07), 일괄 삭제, 단건 조회. 웹 화면은 기능 위주 최소 UI만(D-09 전, 시각 디자인 제외).

## 사용자 흐름 및 수용 기준

- [x] AC-01 목록: 활성 북마크를 최근 저장 순(`createdAt` 내림차순, 같으면 `id` 내림차순)으로 반환한다. 다른 사용자의 북마크는 보이지 않는다.
- [x] AC-02 페이지: `limit`(기본 20, 1~50)개씩 반환하고 다음 페이지가 있으면 `nextCursor`, 없으면 `null`. 페이지를 넘기는 사이 새로 저장된 링크가 있어도 이미 본 항목이 중복되거나 빠지지 않는다(커서 기준).
- [x] AC-03 휴지통: `status=deleted`면 삭제된 북마크를 최근 삭제 순으로 같은 방식으로 반환한다.
- [x] AC-04 삭제: 활성 북마크를 삭제하면 `204`, 이후 목록에서 사라지고 휴지통에 나타난다. 이미 삭제된 것을 다시 삭제해도 `204`(멱등).
- [x] AC-05 복구: 삭제된 북마크를 복구하면 `200`과 북마크를 반환하고 활성 목록에 다시 나타난다. 이미 활성이면 `200`(멱등).
- [x] AC-06 복구 충돌: 같은 정규화 URL의 활성 북마크가 이미 있으면 복구하지 않고 `409 BOOKMARK_ALREADY_SAVED`와 활성 북마크 `bookmarkId`를 반환한다.
- [x] AC-07 권한: 다른 사용자의 북마크 ID, 없는 ID, 형식이 틀린 ID는 삭제·복구 모두 `404 BOOKMARK_NOT_FOUND`(존재 여부를 드러내지 않는다). 목록에도 다른 사용자의 북마크는 없다. FEAT-003 AC-17(교차 사용자 접근 거부)의 조회·삭제 경로 검증을 여기서 마친다.
- [x] AC-08 FEAT-001 연계: 삭제 후 같은 URL을 저장하면 FEAT-001 AC-07대로 `409 BOOKMARK_DELETED`, 그 `bookmarkId`로 복구하면 활성이 된다.

웹(로그인 홈)

- [x] AC-09 저장: 링크 주소를 입력해 저장하면 내 링크 목록 맨 위에 보인다. 이미 저장된 링크(200)도 같은 안내. `409 BOOKMARK_DELETED`면 서버 문구와 [복구] 버튼을 보여 주고, 누르면 그 북마크가 복구된다. 그 밖의 오류는 서버 문구 그대로.
- [x] AC-10 목록: 내 링크를 최근 저장 순으로 보여 주고, 다음 페이지가 있으면 [더 보기]로 이어서 불러온다. 비어 있으면 빈 상태 안내.
- [x] AC-11 삭제: 각 링크의 [삭제]를 누르면 내 링크에서 사라지고 휴지통에 나타난다.
- [x] AC-12 휴지통: [내 링크]·[휴지통] 전환. 휴지통의 [복구]를 누르면 내 링크로 돌아간다. `409 BOOKMARK_ALREADY_SAVED`면 서버 문구.
- [x] AC-13 공통: 오류는 서버 `message` 그대로(ADR-009), 요청 중 해당 버튼 비활성, 라벨·alert·키보드 조작.

## 데이터 계약

- 서버 소유 값: 정렬 순서, 페이지 경계(`nextCursor`), 삭제 상태.
- 프론트 전용 파생 값: 없음. `nextCursor`는 해석하지 않고 그대로 돌려보낸다.
- 프론트 쿼리: 목록 키는 생성 키(`status`·`limit` 포함), 소유 `features/bookmarks`, 커서 페이지는 `useInfiniteQuery`, stale 기본값. 저장·삭제·복구 성공 시 두 목록(활성·휴지통) 키만 무효화. 폴링 없음.
- API 요청/응답/오류 (OpenAPI로 확정):
  - `GET /api/bookmarks?status=active|deleted&limit=20&cursor=...` → `200 { items: BookmarkResponse[], nextCursor: string | null }`. `BookmarkResponse`에 `deletedAt: string | null` 추가.
  - `DELETE /api/bookmarks/:id` → `204`(본문 없음)
  - `POST /api/bookmarks/:id/restore` → `200 BookmarkResponse`
  - 잘못된 `status`·`limit`·`cursor`는 `400 VALIDATION_FAILED`(클라이언트 버그라 공통 문구).
- 오류 문구(ADR-009, 서버 `message` 그대로 표시):

  | status | code                   | 상황                                   | 문구                              |
  | ------ | ---------------------- | -------------------------------------- | --------------------------------- |
  | 404    | BOOKMARK_NOT_FOUND     | 없거나 다른 사용자의 북마크            | 링크를 찾을 수 없어요.            |
  | 409    | BOOKMARK_ALREADY_SAVED | 복구하려는 링크가 이미 활성으로 저장됨 | 같은 링크가 이미 저장되어 있어요. |

- DB 변경/마이그레이션: 활성 목록용 부분 인덱스 `bookmarks(user_id, created_at DESC, id DESC) WHERE deleted_at IS NULL`. 휴지통 인덱스는 만들지 않는다(빈도 낮음, 측정 후).

## UX 및 디자인

- 로그인 홈(계정 화면)에 저장 입력·목록·[내 링크]/[휴지통] 전환을 둔다. 기능 위주 최소 UI(D-09 전). 링크는 새 탭으로 열고 `rel="noopener noreferrer"`.

## 영향도 및 주의사항

- 기존 Feature 및 회귀 위험: FEAT-001 응답 형태에 `deletedAt` 필드가 추가된다(신규 필드라 기존 클라이언트 호환). AC-07 흐름 회귀 테스트.
- 캐시/호출 빈도/무효화: 서버 캐시 없음. 프론트는 삭제·복구·저장 후 목록 쿼리를 무효화한다(화면 작업 시).
- 메모리/동시성/비용/보안: 페이지 크기 상한 50. 소유권은 모든 쿼리에 `user_id` 조건. 삭제된 행은 보관 기간 결정(D-07) 전까지 남는다(행당 수백 바이트, 반복 비용 없음). 인덱스 1개 추가.
- 롤백 및 데이터 호환성: 인덱스 추가 마이그레이션만(down: `DROP INDEX`). 데이터 변경 없음.

## 테스트 계획

테스트 이름은 `AC-xx: 동작 문장` 형식으로 수용 기준과 연결한다.

- Unit: 커서 인코딩·디코딩(잘못된 커서 거부).
- Integration (`*.int.test.ts`, 실제 PostgreSQL, 실제 Access Token으로 호출): AC-01~08. AC-02는 페이지 사이에 새 저장을 끼워 넣어 중복·누락이 없음을 확인.
- Web(Vitest·Testing Library): 저장·409 복구 버튼·목록·더 보기·삭제·휴지통 복구·무효화 범위(AC-09~13).
- Manual: 실제 브라우저에서 저장 → 삭제 → 휴지통 복구 → 같은 링크 재저장 409 → 복구.
- Regression: FEAT-001 통합 테스트 유지.

## 결정 사항 (2026-11-10, 사용자 승인)

1. 휴지통 목록(AC-03) 포함.
2. 페이지 크기 기본 20·최대 50.
3. 오류 문구 2개 표대로.
4. 최소 웹 화면 포함(10월의 "화면은 사용자 작성" 결정을 바꿈).

## 구현 결과 (검증 후)

- 변경 파일/PR: 브랜치 `feature/bookmark-list-delete`. API `bookmarks.{controller,service,repository}.ts`, `lib/cursor.ts`, `dto/list-bookmarks.dto.ts`·`bookmark-response.dto.ts`, 마이그레이션 `20261110120000_add_bookmarks_active_list_index`. 웹 `features/bookmarks/**`, `features/auth/ui/AccountHeader.tsx`, `app/page.tsx`, `shared/ui/FormParts.tsx`·`shared/lib/server-message.ts`(auth에서 이동).
- 실행 명령 및 실제 결과(2026-11-10, 로컬):
  - api 단위 125 PASS, `npm run test:integration` 88 PASS(목록·삭제·복구 18), web 40 PASS(북마크 8), `npm run verify` PASS(8/8), `npm run build` PASS.
  - 동시 복구 10개(같은 링크) → 활성 1, 나머지 409.
  - 변이 검사: 삭제 소유자 조건 제거 → AC-07 실패, 키셋 조건 제거 → AC-02 실패, 복구 UNIQUE 처리 제거 → AC-06 2건 실패, 복구 후 PASS.
  - 브라우저(Chrome, 사용자 수동): 홈(my-아이디·로그아웃·북마크)과 로그인 화면 Google 버튼 정상(사용자 보고, 항목별 확인 범위는 명시 안 됨).
- 남은 위험:
  - 삭제된 행은 보관 기간 결정(D-07) 전까지 남는다. 휴지통 인덱스는 빈도 측정 후.
  - API가 꺼져 있으면 소셜 버튼이 안내 없이 숨는다(개선 여지, 사용자에게 안내함).
