# FEAT-010 — 링크 저장 시 제목·태그와 썸네일

- Status: Implemented
- Updated: 2026-11-18
- Related: PRD(01) 모으기·카테고리·태그·버킷 정책 / ADR-014(레퍼런스 라이브러리, 이미지 업로드 기본값) / ADR-015 / FEAT-001(저장) / FEAT-002(목록) / FEAT-008(태그 테이블) / spec 04 bookmarks·tags·bookmark_tags / 홈 시안 F1(LINK-01 캔버스)

## 목적 및 비범위

- 사용자 문제: 인스타그램 링크를 저장해도 목록에 주소만 보여 무엇이었는지 알 수 없다. 저장할 때 직접 붙인 제목·태그와 썸네일이 함께 남아야 다시 찾을 수 있다.
- 이번 작업에서 하지 않는 것: 카테고리(FEAT-008 나머지), AI 분류·요약, 이미지 여러 장 첨부(`bookmark_images`), 썸네일 리사이즈·포맷 변환, 운영용 오브젝트 스토리지(S3 등) 연결, 유튜브 자막, 링크 상세 화면.

## 검토한 대안

썸네일 확보 방법:

| 선택지                                     | 장점                                              | 단점                                                                           |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| A. og:image 주소만 저장                    | 가장 단순                                         | 인스타 이미지 주소는 서명·만료돼 며칠 뒤 깨진다. 남의 CDN을 그대로 불러온다    |
| B. 사용자가 캡처를 직접 올리기만           | 항상 성공                                         | 매번 손이 간다                                                                 |
| C. 서버가 og:image를 받아 보관 + 실패 시 B | 대부분 자동, 막혀도 저장은 성공, 이미지가 안 깨짐 | 서버 요청(SSRF 방어)·파일 보관이 필요. 인스타가 서버 요청을 막으면 자동은 실패 |

- 추천 및 근거: C(사용자 결정 2026-11-18). 저장은 썸네일과 무관하게 즉시 성공하고, 썸네일은 뒤에서 채운다(ADR-014 "AI·부가 처리 장애에도 저장은 성공"). 인스타의 서버 요청 차단 여부는 개발 환경에서 확인하지 못했다(클라우드·VM 모두 instagram.com 접근 불가) → 사용자 Mac에서 확인 후 구현.
- 관련 ADR: 없음(파일 보관 위치는 개발용 로컬 디스크로 시작하고, 운영 스토리지는 배포 결정 D-12 때 ADR로).

## 사용자 흐름 및 수용 기준

- [x] AC-01 저장 폼: 링크와 함께 제목(선택, 1~100자)과 태그(선택, 0~10개, 각 1~30자)를 넣어 저장한다. `POST /api/bookmarks`가 `title`·`tags`를 받는다.
- [x] AC-02 태그 생성: 처음 쓰는 태그 이름은 자동으로 만들어진다. 이름은 정규화(앞뒤 공백 제거, 연속 공백 1칸, NFC, 영문 소문자) 후 사용자별로 하나다. 같은 이름을 두 번 넣으면 하나만 붙는다.
- [x] AC-03 중복 링크: 이미 저장된 링크면(FEAT-001 AC-02) 기존 링크를 돌려주고, 입력한 제목·태그는 덮어쓰지 않는다(응답 `200`). 수정은 이후 편집 기능에서.
- [x] AC-04 썸네일 자동: 저장 직후 서버가 링크 페이지의 `og:image`를 받아 보관한다. 상태는 `pending → ready | failed`. 저장 응답은 기다리지 않는다(`thumbnailStatus: "pending"`).
- [x] AC-05 썸네일 실패: 페이지·이미지를 못 받으면 `failed`. 목록에 빈 썸네일과 "캡처 올리기"가 보인다. 실패해도 링크·제목·태그는 그대로다.
- [x] AC-06 직접 올리기: JPG·PNG·WEBP·GIF, 10MB 이하 이미지를 올리면 썸네일을 바꾼다(`ready`, 출처 `upload`). 이후 자동 결과가 늦게 와도 올린 이미지를 덮어쓰지 않는다. 이미지가 이미 있어도(자동 썸네일·전에 올린 캡처) 바꿀 수 있다(2026-11-21). 활성 목록의 ⋯ 메뉴에서 이미지가 있으면 "이미지 바꾸기", 없으면 "캡처 올리기"(FEAT-011 AC-05, 썸네일 누르기는 선택).
- [x] AC-07 제목 기본값: 제목을 비워 두면 목록에는 페이지의 `og:title`(받았을 때), 그것도 없으면 도메인을 보여 준다(앞의 `www.`·`m.`은 뺀다, AC-17). 사용자가 넣은 제목이 항상 우선한다.
- [x] AC-08 인스타 주소 정리: `instagram.com/p/…`, `/reel/…` 주소는 쿼리(`img_index`, `jplx` 등)를 모두 떼고 저장해, 같은 게시물을 다른 장으로 공유해도 중복으로 묶는다.
- [x] AC-09 권한: 남의 북마크 썸네일은 볼 수도 올릴 수도 없다(404). 썸네일 이미지 주소는 짧게(10~20분) 만료되는 서명 주소다.
- [x] AC-10 SSRF 방어: 서버 요청은 http·https만, 사설·루프백·링크로컬 IP로 풀리는 주소 거부, 리다이렉트 3회·응답 3MB(페이지, 넘으면 앞부분만 읽음 — AC-13)·10MB(이미지, 넘으면 거부)·5초 제한, 이미지는 실제 바이트로 형식 확인.
- [ ] AC-11 원본 이미지 대체(2026-11-20): `og:image` 주소를 받으면 이미지 보관 전에 원본 주소를 남기고(`thumbnail.sourceUrl`, 직접 올린 썸네일이면 `null`), 화면은 보관 파일 → 원본 주소 → 아트워크 순으로 불러 본다. 보관 파일이 만료·삭제·서버 디스크 초기화(무료 호스팅)로 없어져도, 서버가 이미지를 못 받았어도 원본이 살아 있으면 보인다. 원본 사이트에는 리퍼러를 보내지 않는다(`referrerPolicy="no-referrer"`). 기존 행은 원본 주소가 없어 그대로.
- [ ] AC-12 대체 태그(2026-11-21): 대표 이미지는 `og:image` → `twitter:image` → `<link rel="image_src">`, 제목은 `og:title` → `twitter:title` → `<title>` 순으로 고른다. HTML 안 순서와 관계없이 이 순위를 따르고, 값이 비었거나 http(s) 주소가 아니면 다음 순위로 넘어간다. og 태그가 없는 사이트도 제목·썸네일이 보인다.
- [ ] AC-13 큰 페이지(2026-11-21): 페이지가 3MB를 넘으면 실패로 끝내지 않고 앞 3MB만 읽어 AC-12로 파싱한다(대표 태그는 `<head>`에 있다). 이미지 상한(10MB 넘으면 거부)은 그대로.
- [ ] AC-14 재시도(2026-11-21): 페이지·이미지 요청이 일시적으로 실패하면(시간 초과, 연결 끊김·일시적 DNS 실패, HTTP 5xx·429) 1초 뒤 한 번만 다시 받는다. 차단(403)·없음(404)·주소 거부·크기 초과는 다시 시도하지 않는다. 서버 종료 중에는 다시 시도하지 않는다.
- [x] AC-15 파비콘(2026-11-21): 보여 줄 썸네일이 하나도 없을 때(보관 파일·원본 주소 모두 없거나 불러오지 못함) 아트워크 가운데에 그 사이트의 파비콘을 흰 둥근 타일(40px, 아이콘 24px)로 올린다. 파비콘 주소는 서버가 같은 HTML에서 `apple-touch-icon` → `<link rel="icon">`(가장 큰 `sizes`) → `shortcut icon` 순으로 고르고(`faviconUrl`), 없거나 HTML을 못 받았으면 화면이 `사이트 주소/favicon.ico`를 불러 본다. 파비콘도 못 불러오면 아트워크만 보인다. 서버는 파비콘을 받거나 보관하지 않고(요청 추가 없음), 화면은 원본 사이트에 리퍼러를 보내지 않는다. 외부 파비콘 서비스는 쓰지 않는다(D-16). 기존 행은 `faviconUrl`이 없어 `/favicon.ico`부터.
- [x] AC-16 추적 값·스마트스토어 주소(2026-11-21): 중복 판단용 정규화에서 `utm_id`·`NaPm`(네이버 광고·쇼핑 경로)·`gbraid`·`wbraid`(구글 광고)·`msclkid`(빙 광고)도 뗀다(이름 정확히 일치). 스마트스토어 상품 주소(`/{가게}/products/{번호}`)는 쿼리를 모두 떼고 `m.smartstore.naver.com`을 `smartstore.naver.com`으로 맞춰, 모바일·PC와 광고·검색 경로가 달라도 같은 상품은 하나로 묶는다. 사용자가 넣은 원래 주소(`url`)는 그대로 둔다.
- [x] AC-17 사이트 이름(2026-11-21): 제목도 페이지 제목도 없으면 도메인에서 앞의 `www.`·`m.`을 뺀 이름을 보여 준다(`m.smartstore.naver.com` → `smartstore.naver.com`).
- [x] AC-18 가게 이름(2026-11-21): 스마트스토어(`smartstore.naver.com/{가게}/…`)·브랜드스토어(`brand.naver.com/{브랜드}/…`) 링크는 제목을 못 받으면 주소의 첫 경로로 `diaday · 스마트스토어`처럼 보여 준다(모바일 주소 포함). 첫 경로가 목록·검색 화면(`main`·`search`·`category` 등)이거나 영문·숫자·`_`·`-` 1~50자가 아니면 AC-17(사이트 이름)로.
- [x] AC-19 짧은 주소(2026-11-21): 썸네일 작업이 리다이렉트로 다른 주소에 닿으면 그 마지막 주소를 남기고(`resolved_url`, 처음 값만, 페이지가 막혀도), 표시 제목의 사이트 이름(AC-17·18)은 이 주소로 만든다. `naver.me/…`처럼 정보 없는 짧은 주소도 `diaday · 스마트스토어`로 보인다. 응답 `url`(열 때 쓰는 주소)과 중복 판단(정규화 주소)은 그대로 — 짧은 주소와 상품 주소는 다른 링크로 저장된다.
- [x] AC-20 쿠팡(2026-11-21): 쿠팡도 서버 요청에 상품 페이지 대신 403을 준다(`link.coupang.com` 짧은 주소는 302로 상품 주소를 알려 줌, 사용자 Mac 확인). 주소에 상품 번호뿐이라 제목을 못 받으면 상품 주소는 `쿠팡 상품`, 그 밖(짧은 주소 등)은 `쿠팡`으로 보인다(AC-19의 마지막 주소 기준). 중복 판단에서 쿠팡 상품 주소(`/vp/products/{번호}`)는 `itemId`·`vendorItemId`만 남기고(이 순서) `m.`·맨 도메인을 `www.coupang.com`으로 맞춘다.
- 참고(2026-11-21 확인): 스마트스토어는 서버 요청에 상품 페이지 대신 429 "에러페이지 - 시스템오류"를 준다(KeepioBot·facebookexternalhit·브라우저 User-Agent 모두 같음). 사용자 브라우저 확인 방식이라 이름만 바꿔서는 받을 수 없고, 차단을 우회하지 않는다(D-16). 스마트스토어 링크는 사이트 이름 + 아트워크·파비콘으로 보이고, 캡처 올리기·제목 수정으로 채운다.

## 검토한 대안 — 파비콘(AC-15)

| 선택지                                    | 장점                                                 | 단점                                                      |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| A. 화면만: 항상 `사이트 주소/favicon.ico` | API·DB 변경 없음, 바로 적용                          | 아이콘을 다른 곳에 두는 사이트는 못 찾는다, 작고 흐릿함   |
| B. 서버가 HTML에서 주소만 읽음 + A로 대체 | 큰 아이콘(apple-touch-icon)을 찾는다, 요청 추가 없음 | DB 컬럼·API 필드 1개 추가, 주소는 원본 사이트에서 불러옴  |
| C. 서버가 파비콘을 받아 보관              | 원본이 사라져도 보인다                               | 요청·저장 추가(SSRF 경로 늘어남), 작은 아이콘에 과한 처리 |

- 추천 및 근거: B(사용자 결정 2026-11-21). 썸네일 원본 주소(AC-11)와 같은 방식이라 서버 요청이 늘지 않는다.

## 데이터 계약

- 서버 소유 값: 정규화된 태그 이름과 중복 판정, 태그 상한(링크당 10·사용자당 500), 썸네일 상태·출처, 기본 제목(`og:title`), 서명 주소 만료.
- 프론트 전용 파생 값: 표시 제목 대체(사용자 제목 → `og:title` → 도메인)는 서버가 `displayTitle`로 준다. 프론트 계산 없음.
- API:
  - `POST /api/bookmarks` body `{ url, title?, tags?: string[] }` → 기존 응답 + `title`, `displayTitle`, `tags: [{ id, name }]`, `thumbnail: { status, url | null, sourceUrl | null }`(sourceUrl은 AC-11)
  - `GET /api/bookmarks` 각 항목에 같은 필드 추가
  - `PUT /api/bookmarks/:id/thumbnail` multipart `file` → 200 북마크
  - (AC-15) 북마크 응답에 `faviconUrl: string | null` 추가
  - `GET /api/files/thumbnails/:key?exp&sig` → 이미지(서명 검증, 인증 헤더 불필요. `<img>`로 부르기 위함)
- 오류 문구(ADR-009):

  | status | code               | 상황                           | 문구                                            |
  | ------ | ------------------ | ------------------------------ | ----------------------------------------------- |
  | 400    | VALIDATION_FAILED  | 제목 100자 초과·태그 1~30자 밖 | 제목은 100자, 태그는 30자까지 입력할 수 있어요. |
  | 422    | BOOKMARK_TAG_LIMIT | 태그 10개 초과                 | 링크 하나에 태그는 10개까지 달 수 있어요.       |
  | 422    | TAG_LIMIT          | 사용자 태그 500개 초과         | 태그는 500개까지 만들 수 있어요.                |
  | 400    | UNSUPPORTED_IMAGE  | 형식이 다르거나 깨진 이미지    | JPG·PNG·WEBP·GIF 이미지만 올릴 수 있어요.       |
  | 413    | IMAGE_TOO_LARGE    | 10MB 초과                      | 이미지는 10MB까지 올릴 수 있어요.               |
  | 404    | NOT_FOUND          | 없거나 남의 북마크             | 링크를 찾을 수 없어요.                          |

- DB 변경/마이그레이션(모두 추가만, 기존 행 영향 없음):
  - `bookmarks`: `title varchar(100) NULL`, `page_title varchar(300) NULL`(og:title), `thumbnail_key text NULL`, `thumbnail_status` enum(`pending`,`ready`,`failed`) NOT NULL DEFAULT `failed`(기존 행은 썸네일 없음으로), `thumbnail_source` enum(`auto`,`upload`) NULL, `thumbnail_source_url varchar(2048) NULL`(AC-11, 마이그레이션 `20261120000000_add_bookmark_thumbnail_source_url`)
  - (AC-19) `bookmarks.resolved_url varchar(2048) NULL`(마이그레이션 `20261121010000_add_bookmark_resolved_url`, 응답에 넣지 않음)
  - (AC-15) `bookmarks.favicon_url varchar(2048) NULL`(마이그레이션 `20261121000000_add_bookmark_favicon_url`)
  - `tags(id, user_id, name, normalized_name, created_at)` UNIQUE `(user_id, normalized_name)` — FEAT-008 정의와 동일
  - `bookmark_tags(bookmark_id, tag_id)` PK 복합, 양쪽 CASCADE

## UX 및 디자인

- 저장 폼(홈 F1 저장창·`/links`): 링크 입력 아래 "제목(선택)"과 태그 입력. 태그는 Enter·쉼표로 칩이 되고 Backspace로 지운다. 키보드만으로 추가·삭제 가능, 칩 삭제 버튼은 `aria-label="태그 ○○ 삭제"`.
- 목록 행: 썸네일(4:3, 둥근 모서리) · 표시 제목 · 도메인 · 태그 칩. `pending`은 회색 상자 + "썸네일 가져오는 중", `failed`는 아트워크(+ 파비콘, AC-15) + ⋯ 메뉴의 "캡처 올리기"(FEAT-011 AC-05, 2026-11-21 썸네일 위 버튼에서 메뉴로 옮김).
- 기존 컴포넌트·토큰 재사용: `SaveBookmarkForm`, `BookmarkList`, `FormParts`, 색 토큰(라이트·다크).

## 영향도 및 주의사항

- 회귀 위험: FEAT-001 저장 응답에 필드가 늘어남(추가만). 정규화 변경(AC-08)은 기존 인스타 북마크와 새 저장의 중복 판정이 달라질 수 있음 → 기존 데이터는 개발용뿐이라 마이그레이션 없이 진행.
- 동시성: 썸네일 작업은 저장 트랜잭션 뒤 프로세스 안에서 비동기로 실행(큐 도입 전 임시). 서버가 재시작되면 `pending`이 남을 수 있어, 시작 시 오래된 `pending`을 `failed`로 돌린다.
- 보안: SSRF(AC-10), 업로드 형식은 확장자가 아니라 바이트로 확인, 파일 이름은 서버가 만든 무작위 키. 썸네일 주소는 HMAC 서명(키는 JWT_SECRET에서 용도별 파생)·10~20분 만료(같은 10분 구간은 같은 주소라 브라우저 캐시가 동작).
- 비용·저장: 개발은 `STORAGE_DIR`(기본 `./.storage`, git 제외) 로컬 디스크. 운영 스토리지는 배포 결정 때.
- 요청 User-Agent: 기본 `KeepioBot`(정직한 이름). 인스타가 이 이름에 og 태그를 안 주면 `LINK_PREVIEW_USER_AGENT`로 바꾼다. 서버 요청은 프록시 환경 변수를 쓰지 않는다(운영에 egress 프록시가 있으면 별도 대응).
- 인스타 정책: 서버가 받는 것은 공개 페이지의 대표 이미지 1장뿐, 영상·본문은 받지 않는다(ADR-014 8번).
- 롤백: 추가 컬럼·테이블이라 revert + 마이그레이션 되돌리기로 복구 가능.

## 테스트 계획

- Unit: 태그 정규화·중복 제거, 인스타 주소 정리, og 태그 파서, IP 차단 판정, 이미지 바이트 판정, 서명 주소 생성·검증·만료.
- Integration(실제 DB): AC-01~03(태그 생성·재사용·상한), AC-06(업로드 후 자동 결과가 덮어쓰지 않음), AC-09(남의 북마크 404).
- 썸네일 요청은 가짜 HTTP 서버로: 성공·404·리다이렉트 4회·사설 IP·너무 큰 응답·이미지 아님.
- AC-12: `apps/api/src/bookmarks/lib/open-graph.test.ts`(twitter·`<title>`·`image_src` 대체, 순위, 빈 값·비 http 건너뜀). AC-13: `lib/safe-fetch.test.ts`(truncate 시 상한까지 반환, 상한 안이면 그대로). AC-14: `link-preview.fetcher.test.ts`(재시도 대상 판정), `bookmark-meta.int.test.ts`(5xx·시간 초과 뒤 성공, 403은 1번, 계속 5xx면 2번 후 failed). 실행: `npm run test --workspace=@keepio/api`, `npm run test:integration --workspace=@keepio/api`.
- Web: 태그 입력 키보드 동작, `pending`/`failed`/`ready` 표시, 업로드 오류 문구.
- 수동: 사용자 Mac에서 예시 인스타 링크 저장 → 썸네일 자동 여부 확인.

## 구현 결과 (검증 후)

- 변경 파일/PR: `prisma/schema.prisma`, 마이그레이션 `20261118000000_add_bookmark_meta`, `apps/api/src/bookmarks/`(repository·service·controller, `bookmark-thumbnails.service.ts`, `bookmark-files.controller.ts`, `thumbnail.storage.ts`, `link-preview.fetcher.ts`, `upload-error.filter.ts`, `lib/` normalize-tag·open-graph·image-type·signed-url·safe-fetch, normalize-url 인스타 규칙), `config/env.ts`(STORAGE_DIR·LINK_PREVIEW_USER_AGENT), `packages/api-client`(재생성), `apps/web/src/features/bookmarks`(TagInput·BookmarkThumb·SaveBookmarkForm·BookmarkList·폴링), `features/home/ui/TriageRow.tsx`(표시 제목).
- 실행 명령 및 실제 결과(클라우드, Node 24.22.1, PostgreSQL 16):
  - api `vitest run` 151 PASS(신규 lib 단위 포함), `vitest run --config vitest.int.config.mts` 99 중 98 PASS — 실패 1건은 `_prisma_migrations` 확인 테스트(이 환경은 Prisma 엔진 다운로드가 막혀 마이그레이션을 SQL로 직접 적용). FEAT-010 통합 12건 PASS.
  - web `vitest run` 61 PASS(신규 4), `tsc`·`eslint --max-warnings=0` PASS, `next build` PASS. api `tsc`·eslint·`nest build` PASS, 루트 `prettier --check .` PASS.
  - OpenAPI·api-client 재생성(`openapi-export` + orval).
- 남은 위험:
  - 마이그레이션 SQL은 손으로 썼다(이 환경에서 `prisma migrate dev` 불가). Mac에서 `npm run db:deploy` 후 `npm run db:migrate -- --create-only`로 차이가 없는지 확인 필요.
  - 실제 인스타 링크의 자동 썸네일은 사용자 Mac에서 확인 필요(이 환경은 instagram.com 접근 불가). og:image는 `facebookexternalhit` UA로 받아지는 것을 사용자가 확인했고, 기본 UA(KeepioBot)는 미확인.
  - 썸네일 작업은 프로세스 안 비동기(큐 전). 서버 재시작 시 pending은 10분 뒤 failed로 정리.

## 후속 변경 (2026-11-21, AC-15 파비콘)

- 서버: `lib/open-graph.ts`가 `icon`(apple-touch-icon → icon·shortcut icon, 같은 순위는 큰 `sizes`, mask-icon 제외)을 고르고, 썸네일 작업이 대표 이미지 유무와 관계없이 `favicon_url`에 처음 값만 남긴다(`setFaviconUrl`). 응답 `faviconUrl`.
- 웹: `shared/lib/favicon-sources.ts`(faviconUrl → 사이트 주소/favicon.ico), `shared/ui/FaviconTile.tsx`(흰 둥근 타일, 불러온 뒤에만 보임, 모두 실패하면 그리지 않음, no-referrer). `BookmarkThumb`(목록·카드의 아트워크 상태)와 `TriageRow`(정리할 링크)에 올린다.
- 테스트: `open-graph.test.ts` AC-15 2건, `bookmark-meta.int.test.ts` AC-15 2건(아이콘 주소 저장·아이콘 받지 않음, 태그 없으면 null), `bookmarks.int.test.ts` 응답에 `faviconUrl`, 웹 `Home.test.tsx` 파비콘 2건.
- 남은 위험: 마이그레이션 SQL·Prisma 생성물·OpenAPI·api-client는 이 환경에서 생성 도구를 못 돌려 손으로 맞췄다(엔진 다운로드 차단). 사용자 Mac에서 `npm run db:generate`·`npm run db:deploy`·`npm run openapi:check`로 확인 필요. 통합 테스트도 Mac에서.
