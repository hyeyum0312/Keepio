# keepio Development History

> 단일 파일·최신순 누적. 실제 변경의 원본은 Git이다. 이 파일에는 변경 이유·영향·검증 결과만 기록한다.
> 실제로 실행하지 않은 검증은 통과로 기록하지 않는다. 형식: `docs/standards/HISTORY.md`.

<!-- 새 기록은 이 주석 바로 아래, 기존 기록 위에 추가한다. -->

## 2026-11-13 | docs: 모바일 첫 화면은 패밀리 심볼 하나로 (spec 07)

- Feature: N/A
- 목적: 모바일에서 흩어진 캐릭터가 좁은 화면을 산만하고 피로하게 만든다는 사용자 피드백 반영.
- 변경: 07-BRAND 7.1 모바일 규칙을 "패밀리 심볼 하나를 문구 위 가운데에"로 변경(다크는 유리알 심볼 3개를 같은 배치로).
- 영향: 문서만.
- 검증: `npm run format:check` PASS. 다크 배치는 렌더해 육안 확인.
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 무대 배경 다크 대비 설명 정정 (spec 07)

- Feature: N/A
- 목적: 직전 커밋에서 다크 무대 배경 가운데가 `background`와 같다고 잘못 적은 부분을 고친다.
- 변경: `stage` 토큰 설명을 "라이트는 가운데 = background, 다크는 가운데가 살짝 밝음(본문 대비 14.49:1)"으로 정정.
- 영향: 문서만.
- 검증: 대비 WCAG 공식으로 계산. `npm run format:check` PASS.
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 첫 화면 무대형 레이아웃 확정과 패밀리 심볼 에셋 추가 (spec 07 v0.4)

- Feature: N/A
- 목적: 로그인 시안 B안(가운데 카드 + 캐릭터 무대)을 사용자가 확정해 첫 화면 레이아웃 원칙으로 남긴다.
- 변경: 07-BRAND 7.1 "첫 화면 레이아웃: 캐릭터 무대" 추가, 모드별 캐릭터 에셋 규칙(다크는 유리알 `*-symbol-dark.svg`, 높이 약 1.55배), `stage` 배경 그라데이션 토큰 추가. 사용자가 만든 `apps/web/public/svg/keepio-symbol-family-light.svg`(패밀리 심볼) 추가.
- 영향: 문서와 정적 SVG 1개. 코드에서 아직 참조하지 않음. 코드 토큰은 D-09 확정 전까지 변경 없음.
- 검증: `npm run format:check` PASS. SVG는 렌더해 라이트·어두운 배경에서 육안 확인. `npm run verify` 전체는 미실행(작업 VM이 macOS용 node_modules로 빌드 불가, 로컬 실행 필요).
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 브랜드 기준 v0.3 — 레퍼런스 원칙 반영과 소셜 버튼 가이드 규칙 (spec 07)

- Feature: N/A
- 목적: 사용자가 준 브랜드 레퍼런스(피클)의 원칙을 기준 문서에 반영하고, 소셜 로그인 버튼을 제공자 가이드에 맞춘다.
- 변경: 07-BRAND 성격 키워드에 "친근하다" 추가, 원칙 8 "UI는 무채색, 색은 캐릭터가" 추가, 글자 크기 단계(24·32·40·48)와 큰 제목 자간 규칙, 반경(우리 버튼 알약형·입력창/소셜 12·카드 24), 캐릭터 사용 범위(표현 영역 안에서 패밀리 여럿 허용). 소셜 버튼 규칙: 제공자 가이드 우선, 문구 "카카오 로그인"·"Google 로그인", 반경 12px(카카오 가이드·Google 브랜딩 가이드 2026-11-13 확인).
- 영향: 문서만. 이미 구현된 웹 소셜 버튼 문구("Google로 계속하기"·"카카오로 계속하기", FEAT-004)는 가이드와 달라 후속 코드 작업 필요. 코드 토큰은 D-09 확정 전까지 변경 없음.
- 검증: `npm run format:check` PASS. `npm run verify` 전체는 미실행(작업 VM이 macOS용 node_modules로 빌드 불가, 로컬 실행 필요).
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 주 버튼 토큰을 잉크색으로, 브랜드 레드는 accent로 분리 (spec 07 v0.2)

- Feature: N/A
- 목적: 로그인 시안에서 레드 주 버튼이 소셜 버튼·캐릭터와 경쟁하고 강조색 비율(10%)을 넘어 차분한 잉크색으로 바꾼다(사용자 피드백).
- 변경: 07-BRAND `primary`를 `neutral-800`/`neutral-100`으로, `primary-foreground` 대비 갱신, `accent`(red-500/red-300) 토큰 추가, 원칙 1에 "화면의 주인공을 먼저 정한다" 보강, 3층 브랜드 토큰을 `accent` 기준으로 변경. standards DESIGN 제안 토큰 목록에 `accent` 추가.
- 영향: 문서만. 코드 토큰은 D-09 확정 전까지 변경 없음. 시안 캔버스(AUTH-01 v0.2)에 같은 값 반영.
- 검증: 대비는 WCAG 공식으로 재계산(라이트 버튼 16.0:1, 다크 13.69:1). `npm run format:check` PASS. `npm run verify` 전체는 미실행(작업 VM이 macOS용 node_modules로 빌드 불가, 로컬 실행 필요).
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 브랜드·디자인 기준 후보 추가 (spec 07)

- Feature: N/A
- 목적: 시안이 감이 아니라 원칙에 근거하도록 브랜드 성격·디자인 원칙·토큰 기준을 한 문서로 둔다.
- 변경: `docs/spec/07-BRAND.md` 추가(브랜드 키워드, 디자인 원칙 7개, 색 3층 구조와 라이트·다크 역할 토큰 14개 및 대비 수치, 글자·간격·모양·움직임·말투, 토큰 운영 원칙, 패밀리 서비스 방식, 피드백 방식). 02-DESIGN·standards DESIGN·README·AGENTS에 링크.
- 영향: 문서만. 코드 토큰(`globals.css`)은 D-09 확정 전까지 바꾸지 않음. standards에 없던 `muted-foreground`·`input` 토큰과 `ai` 값 변경(`#7F77DD`→`#6B63D6`)은 제안 상태.
- 검증: 대비 수치는 WCAG 상대 휘도 공식으로 계산(Python). `npx prettier --check` PASS(변경 파일). `npm run verify` 전체는 미실행(작업 VM이 macOS용 node_modules로 빌드 불가, 로컬 실행 필요).
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 화면 ID 규칙과 화면 목록 추가

- Feature: N/A
- 목적: 화면마다 고유 ID를 붙이고 기능(FEAT)·기획서·Figma·경로를 한 표에서 연결해 전체 흐름을 한눈에 본다.
- 변경: `docs/spec/06-SCREENS.md` 추가(ID 규칙 `영역-번호`, 상태 값, 1차·2차 화면 24개). `docs/README.md` 스펙 목록과 `AGENTS.md` 스펙 원본 목록에 링크 추가.
- 영향: 문서만. 코드·API·DB·비용 영향 없음. 예정 화면의 경로는 `(제안)`으로 표시했고 확정 아님.
- 검증: `npx prettier --check` PASS(변경 파일). `npm run verify` 전체는 미실행(작업 VM이 macOS용 node_modules로 빌드 불가, 로컬 실행 필요).
- 주의/롤백: revert로 롤백.

## 2026-11-13 | docs: 웹 먼저 출시로 2026 MVP 범위 확정 (ADR-013)

- Feature: N/A
- 목적: 2026-12-31 MVP 출시 목표에 맞춰 범위를 줄이고, 모바일 앱을 2차로 미룬 결정과 이유를 남긴다.
- 변경: ADR-013 추가. spec 05에 2026 MVP 범위 표·주차별 목표 추가, 모바일 PoC를 Phase 5(2차)로 이동, Phase 3 템플릿·블록 범위 축소, Phase 4 완료 조건을 웹 기준으로 변경. spec 01 MVP 범위에 1차/2차 구분. OPEN-QUESTIONS D-08(2차로 이동)·D-12(12월 둘째 주까지 결정) 갱신. AGENTS.md 현재 단계 문장 갱신과 결정 제안 방식 단락 추가(사용자 요청).
- 영향: 문서만. 코드·API·DB·비용 영향 없음. 이후 기능 작업은 1차 범위만 대상으로 한다.
- 검증: `npm run format:check` PASS. `npm run verify` 전체는 미실행(작업 VM이 macOS용 node_modules로 `nest build`를 실행하지 못함, 로컬 실행 필요). 코드 변경 없음.
- 주의/롤백: revert로 롤백.

## 2026-11-11 | feat(web): 사용자 제작 로고로 교체, 다크 버전·GIF를 새 심볼 모양으로 재생성

- Feature: N/A
- 목적: 사용자가 직접 만든 로고·심볼을 정식으로 쓴다.
- 변경: 헤더 `Logo`를 사용자 로고 `keepio-logo.svg`(심볼 + 워드마크 패스, 105×30) 한 장으로 교체해 Outfit 폰트(`next/font/google`)와 vitest 폰트 mock 제거. 라이트 심볼 5색을 사용자 원본(64×88)으로 교체, 이전 라이트 앱 아이콘 5개 삭제. 다크 글로우 심볼·다크 앱 아이콘 5색과 레드 다크 GIF를 새 심볼 모양으로 재생성(기존 다크 팔레트 유지). 레드 라이트 GIF를 사용자 심볼로 재생성(흰 배경, 240px, 3.4초 반복).
- 영향: 로그인 홈 헤더 표시. 빌드 시 Google Fonts 다운로드 불필요. `public/svg`의 라이트 아이콘 경로 제거(코드 참조 없음 확인).
- 검증: `npm run verify` PASS(8/8), `npm run build --workspace=@keepio/web` PASS. 새 SVG `xmllint` 통과, 렌더 육안 확인. GIF 메타데이터(무한 반복, 총 3,400ms)와 프레임 육안 확인. 헤더 브라우저 확인 미실행(로그인 필요).
- 주의/롤백: revert로 롤백.

## 2026-11-11 | feat(web): 로그인 홈 상단에 로고와 서비스명

- Feature: N/A(FEAT-006 AC-12 홈 헤더 보강)
- 목적: 상단에 서비스 정체성(심볼 + keepio)을 보이게 한다.
- 변경: `shared/ui/Logo` — 레드 라이트 심볼(`next/image`, SVG라 `unoptimized`, 장식이라 `alt=""`) + Outfit 700 워드마크(`next/font/google`, 빌드 때 받아 자체 호스팅). `AccountHeader` 상단 줄을 왼쪽 로고, 오른쪽 my-아이디·로그아웃으로 재배치. vitest에는 Next 폰트 변환이 없어 `vitest.setup.ts`에서 `next/font/google` mock.
- 영향: 로그인 홈 헤더만. 랜딩(비로그인)은 그대로. 워드마크 색은 시안 `#1A1A22` 대신 기존 `foreground` 토큰(색 리터럴 금지 규칙). 빌드 시 Google Fonts 다운로드 필요.
- 검증: web 테스트 40 PASS, `npm run verify` PASS(8/8), `npm run build --workspace=@keepio/web` PASS. 브라우저 육안 확인 미실행(로그인 필요, 사용자 확인 예정).
- 주의/롤백: revert로 롤백.

## 2026-11-11 | chore(web): 로고 컬러 세트 SVG와 대표 컬러(레드) 눈 굴리는 GIF

- Feature: N/A
- 목적: 디자인 시안(keepio 컬러 세트)의 로고를 앱에서 정적 파일로 쓸 수 있게 둔다. 대표 컬러는 레드.
- 변경: `apps/web/public/svg/` — 5색(red·yellow·tangerine·blue·purple) × 심볼 라이트/다크(글로우)·앱 아이콘 라이트/다크 SVG 20개. 시안 값 그대로, 그라데이션 id는 파일마다 고유(인라인 충돌 방지), 다크 심볼은 글로우가 잘리지 않게 viewBox 확장. 레드 심볼 GIF 2개(라이트 흰 배경, 다크 `#0A0C14` 배경, 240px, 3.4초 반복: 왼쪽·오른쪽·위 보기와 고개 기울임, 깜빡임).
- 영향: 정적 파일 추가만. 코드 변경 없음. GIF 크기 약 245KB/464KB.
- 검증: SVG 20개 `xmllint` 통과, 일부 PNG 렌더 육안 확인. GIF 메타데이터 확인(반복 무한, 총 3,400ms), 프레임 육안 확인. 생성 스크립트는 저장소에 두지 않음.
- 주의/롤백: 워드마크(“keepio” 글자)는 폰트 의존이라 SVG에 넣지 않음. revert로 롤백.

## 2026-11-10 | docs(feature): FEAT-002 구현 완료 기록과 브라우저 확인

- Feature: FEAT-002
- 목적: 구현·검증 결과를 기록하고 PR을 연다.
- 변경: `bookmark-list-delete.md` Implemented(AC 체크, 구현 결과·남은 위험), Feature 목록, QA 보고서.
- 영향: 문서만.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행(직전 커밋에서 PASS).
- 주의/롤백: revert로 롤백.

## 2026-11-10 | feat(bookmarks): 링크 목록·삭제·휴지통 복구 API와 홈 화면(my-아이디 헤더 + 북마크)

- Feature: FEAT-002, FEAT-006(AC-12)
- 목적: 저장한 링크를 보고 지우고 되돌린다. 홈은 사용자 요청대로 상단 my-아이디·로그아웃, 그 아래 북마크.
- 변경: API — `GET /api/bookmarks`(status active|deleted, limit 기본 20·최대 50, 키셋 커서 `(시각, id)`), `DELETE /api/bookmarks/:id`(멱등 204), `POST /api/bookmarks/:id/restore`(멱등 200, 같은 링크가 활성이면 409 `BOOKMARK_ALREADY_SAVED` + 활성 ID — 부분 UNIQUE가 판정), 다른 사용자·없는·형식 오류 ID는 404 `BOOKMARK_NOT_FOUND`. 응답에 `deletedAt`, 409 응답 모델 이름 `BookmarkConflictErrorResponse`. 활성 목록 부분 인덱스 `(user_id, created_at DESC, id DESC) WHERE deleted_at IS NULL`. FEAT-001의 "저장 충돌 직후 승자 삭제" 분기가 이제 도달 가능해 500 대신 409 `BOOKMARK_DELETED`. 웹 — `features/bookmarks`(저장 폼·409 복구 버튼·목록·더 보기·삭제·휴지통 복구, `useInfiniteQuery`, 성공 시 목록 키만 무효화), `AccountHeader`(my-아이디·로그아웃·인증 전 안내, `AccountPanel` 대체), 홈 구성. 두 번째 사용처가 생긴 폼 부품·서버 문구 헬퍼를 `shared`로 이동(오류 영역 id 지정 가능, 실패 시 응답 반환).
- 영향: 북마크 응답에 필드 추가(호환). 인덱스 1개(북마크당 항목 1개). 홈 진입 시 `/api/me`·활성 목록 1회.
- 검증: api 단위 125 PASS(커서 6 포함). `npm run test:integration` PASS(88, 목록·삭제·복구 18 — 정렬·동시각 id 순·페이지 사이 저장 중복/누락 없음·검증 400·멱등·동시 복구 10개 → 활성 1·교차 사용자 404·FEAT-001 409 연계·토큰 없음 401). 변이 검사: 삭제 소유자 조건 제거 → AC-07 실패, 키셋 조건 제거 → AC-02 실패, 복구 UNIQUE 처리 제거 → AC-06 2건 실패, 복구 후 PASS. web 40 PASS(북마크 8, 홈 헤더). `npm run verify` PASS(8/8), `npm run build` PASS. 브라우저 수동 확인 전.
- 주의/롤백: 코드는 revert. DB는 마이그레이션 끝 롤백 블록(`DROP INDEX`, 데이터 영향 없음). 삭제된 행은 보관 기간 결정(D-07) 전까지 남는다.

## 2026-11-10 | docs(feature): FEAT-002 링크 목록·삭제·복구 명세 확정, FEAT-001 상태 정정

- Feature: FEAT-002, FEAT-001
- 목적: 인증 작업 전에 보관해 둔 FEAT-002 Draft를 되살려 현재 구조(실제 JWT 인증)에 맞추고 남은 결정을 확정한다.
- 변경: `bookmark-list-delete.md` Approved — 휴지통 목록 포함, 페이지 기본 20·최대 50, 오류 문구 2개, 최소 웹 화면 포함(저장·목록·더 보기·삭제·휴지통 복구, AC-09~13 추가), 인증 참조를 D-11에서 FEAT-003으로, AC-07에서 FEAT-003 AC-17 검증 마무리. Feature 목록에 FEAT-002, FEAT-001 Draft → Implemented 정정(구현 PR #23 이후 갱신 누락).
- 영향: 문서만.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-11-10 | docs(feature): FEAT-004 구현 완료 기록과 실제 Google 로그인 확인

- Feature: FEAT-004
- 목적: dev rebase 후 재검증 결과와 브라우저 확인을 기록하고 PR을 연다.
- 변경: `auth-social.md` Implemented(AC 체크, 구현 결과·남은 위험), Feature 목록, QA 보고서.
- 영향: 문서만.
- 검증: dev rebase 후 api 단위 118·통합 70·web 31 PASS, `npm run verify` PASS(8/8), `npm run build` PASS.
- 주의/롤백: revert로 롤백.

## 2026-11-10 | feat(auth): Google·Kakao 소셜 로그인과 계정 연결

- Feature: FEAT-004
- 목적: 비밀번호 없이 Google·Kakao로 가입·로그인하고, 같은 이메일의 기존 계정과 안전하게 이어지게 한다.
- 변경: API — `OAuthGateway`(제공자 통신 추상화) + `OpenIdOAuthGateway`(`openid-client` 6.8.8: discovery·PKCE S256·ID 토큰 검증, timeout 5초), `OAuthService`·`OAuthController`(`/providers`, `/:provider/start`, `/:provider/callback` — 성공 `/auth/callback`, 취소 `/login`, 실패 `/login?oauth=failed`), state·nonce·PKCE verifier를 담는 HMAC 서명 HttpOnly 쿠키(10분, JWT_SECRET에서 용도 분리 키), `AuthRepository.resolveOAuthUser`(한 트랜잭션: 연결 찾기 → 인증된 이메일로 연결(인증 안 된 기존 계정이면 비밀번호 삭제·세션 폐기·인증 기록) → 새 계정, UNIQUE 충돌 시 1회 재시도). `oauth_accounts` 마이그레이션(UNIQUE provider+subject, subject 길이 CHECK). 환경 변수 `GOOGLE_*`·`KAKAO_*`(둘 다 있어야 켜짐)·`API_ORIGIN`. 웹 — 로그인·가입 화면 소셜 버튼(서버 목록 기준), `/auth/callback`(refresh 1회 후 홈), `/login?oauth=failed` 고정 문구(ADR-012, 주소 문구 미사용). `api-client`에 `apiUrl`. `webOrigin` 헬퍼로 AuthService와 공유. 의존성: `openid-client` 6.8.8, `jose`는 루트 overrides로 6.2.13 고정(6.2.15+는 공개 14일 전).
- 영향: 새 테이블 1개(소셜 계정당 1행), 로그인 1회당 제공자 token 호출 1회(+ 첫 로그인 discovery·JWKS). 로그인·가입 화면이 진입 시 `/providers` 1회 호출. 인증 안 된 기존 계정과 연결되면 그 계정의 비밀번호가 사라진다(의도, AC-08).
- 검증: api 단위 118 PASS(흐름 쿠키 9, 환경 변수 소셜 3 포함). `npm run test:integration` PASS(70, 소셜 15 — 시작 쿠키·state·nonce·PKCE 위조·제공자 혼용·취소·계정 결정 4가지·동시 콜백 10개 → 연결 1·계정 1). 변이 검사: UNIQUE 충돌 재시도 제거 → AC-10 3/3 실패, AC-08 비밀번호 삭제 제거 → AC-08 실패, 복구 후 PASS. web 31 PASS(버튼·콜백·실패 문구, 기존 로그인 테스트가 요청 순서를 가정하던 것을 경로 기준으로 수정). `npm run verify` PASS(8/8). `npm run build` PASS(`/auth/callback` 포함). 실제 Google 로그인은 미검증(다음 단계 수동).
- 주의/롤백: 코드는 revert. DB는 마이그레이션 끝 롤백 블록(`oauth_accounts`·enum drop — 소셜 전용 계정은 로그인 수단을 잃는다). `openid-client`를 올릴 때 `jose` overrides를 함께 재검토. Kakao의 `email_verified` 제공 여부는 실제 키로 확인 전(없으면 Kakao는 항상 이메일 없는 새 계정).

## 2026-11-10 | docs(auth): FEAT-004 소셜 로그인 명세와 리디렉션 실패 문구 예외 (ADR-012)

- Feature: FEAT-004
- 목적: Google·Kakao 로그인을 붙이기 전에 흐름·계정 연결 정책·실패 안내를 확정한다(사용자 결정: 인증 안 된 기존 계정은 연결하되 비밀번호·세션 무효화, 실패 문구는 shared 고정 문구).
- 변경: `auth-social.md` Approved(AC 13개 — 서버 처리 Authorization Code + PKCE + OIDC, `/providers`·start·callback, 계정 결정 4가지, 동시 콜백, 웹 버튼·콜백 화면·실패 안내, `oauth_accounts`, `openid-client` 6.8.8). ADR-012(리디렉션 흐름 실패는 주소에 고정 값만, 웹 shared 고정 문구). FRONTEND 오류 규칙, spec 03 소셜 로그인, spec 04 테이블·API. Feature 목록.
- 영향: 문서만.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-11-10 | docs(feature): FEAT-006 구현 완료 기록과 브라우저 확인 결과

- Feature: FEAT-006
- 목적: 구현·검증 결과를 기록하고 PR을 연다.
- 변경: `auth-web.md` Implemented(AC 체크, 구현 결과·남은 위험), Feature 목록, QA 보고서(브라우저 수동 확인 범위와 미확인 항목 명시).
- 영향: 문서만.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행(직전 커밋에서 PASS).
- 주의/롤백: revert로 롤백.

## 2026-11-10 | feat(web): 비로그인 홈을 랜딩으로, 로그인 홈은 계정 화면

- Feature: FEAT-006
- 목적: 사용자 요청 — 로그인 상태면 홈, 아니면 랜딩. 02-DESIGN 정보 구조("로그인 전: 랜딩")와도 맞춘다.
- 변경: `AuthSwitch`(같은 주소에서 확인 중 로딩 / 로그인 / 비로그인 화면 선택), `features/landing`(제품명·태그라인·한 줄 설명·사용 흐름·시작하기/로그인, 최소 UI). `/`는 `AuthSwitch(AccountPanel | Landing)`. 로그아웃하면 같은 주소에서 랜딩. `RequireAuth`(비로그인 시 `/login`)는 이후 보호 화면용으로 유지. FEAT-006 AC-12 갱신.
- 영향: 비로그인 사용자는 `/`에서 `/login`으로 이동하지 않고 랜딩을 본다. 랜딩은 로그인 확인(refresh 1회) 뒤에 그려져 검색 엔진에는 로딩 문구만 보인다(출시 전 재검토).
- 검증: web 25개 PASS(홈 화면 전환·로그아웃 후 랜딩·랜딩 링크 추가). `npm run verify` PASS(8/8). `npm run build` PASS.
- 주의/롤백: revert로 롤백.

## 2026-11-10 | feat(web): 로그인·가입·이메일 인증·비밀번호 재설정 화면과 토큰 처리

- Feature: FEAT-006
- 목적: FEAT-003 이후 북마크 API가 Access Token 없이 401이라 웹이 실제로 로그인하고 토큰을 다뤄야 한다.
- 변경: `features/auth` — Access Token 메모리 저장소(`session-store`, 상태 checking/authenticated/anonymous), `refreshSession`(진행 중 Promise 공유로 동시 refresh 1회), `authFetch`(토큰 첨부, 401 UNAUTHENTICATED면 refresh 1회 후 원 요청 1회 재시도, `/api/auth/*`·다른 401 코드 제외), `useOneTimeUrlToken`(메일 링크 토큰을 읽고 즉시 `history.replaceState`로 제거), 화면(로그인·가입·인증·비밀번호 찾기·재설정·계정/로그아웃·RequireAuth·AuthBootstrap, 기능 위주 최소 UI). 라우트 5개 + 홈. `api-client`의 `apiFetch`에 fetch 주입 지점(`configureApiClient({ fetch })`), `providers`가 `authFetch`·`AuthBootstrap` 연결. `shared/lib/network-error`(ADR-009 서버 무응답 고정 문구).
- 영향: 모든 API 호출이 `authFetch`를 거친다(토큰이 없으면 이전과 같은 요청). 앱 시작 시 refresh 1회. 오류 문구는 서버 message 그대로.
- 검증: web 단위·컴포넌트 23개 PASS(authFetch 8: 첨부·재시도 1회·무한 반복 없음·인증 API 제외·동시 5개에 refresh 1회·실패 시 초기화 / 화면 13: 서버 문구 alert·aria 연결·제출 중 비활성·StrictMode에서 인증 요청 1회·주소 토큰 제거·보호 화면 로딩/리다이렉트·로그아웃). `npm run verify` PASS(8/8). `npm run build` PASS(라우트 7개 정적). 실제 API에 웹 출처 CORS 사전 요청 확인(Allow-Origin·Credentials·authorization 헤더). 빌드에서 `useSyncExternalStore`가 서버 컴포넌트 경로에 섞인 것을 발견해 `"use client"` 훅 파일로 분리.
- 주의/롤백: revert로 롤백. 실제 브라우저 흐름(쿠키·새로고침 유지)은 미검증 — 수동 확인 후 Feature 문서 Implemented. 다른 탭 로그아웃은 즉시 반영되지 않는다(비범위).

## 2026-11-10 | docs(feature): FEAT-006 웹 로그인 화면과 토큰 처리 명세

- Feature: FEAT-006
- 목적: FEAT-003 이후 북마크 API가 Access Token 없이 401이라 웹에 로그인 화면과 토큰 처리가 필요하다(FEAT-003 Q-6 후속).
- 변경: `auth-web.md` Approved — Access Token 메모리 보관, 401 시 refresh 1회 + 원 요청 1회 재시도, 동시 refresh 묶기, 앱 시작 시 refresh로 새로고침 유지, 메일 링크 토큰 즉시 주소 제거, 가입·인증·로그인·비밀번호 찾기·재설정·홈/로그아웃 화면(기능 위주 최소 UI). 번호는 FEAT-004·005가 ADR-011에서 소셜·패스키로 예약되어 006. Feature 목록에 추가.
- 영향: 문서만.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-11-10 | fix(auth): 메일을 백그라운드로 보내 응답 시간으로 가입 여부가 드러나지 않게

- Feature: FEAT-003
- 목적: 비밀번호 재설정 요청·인증 메일 재발송이 가입된 이메일일 때만 메일 발송을 기다려 응답이 수백 ms 느렸다. 응답 본문은 같아도 시간으로 가입 여부를 알 수 있었다(AC-03·AC-14 취지 위반, 리뷰 중 발견).
- 변경: `MailDispatcher`(메모리 큐, 동시 발송 4, 대기 1000 상한 초과 시 버리고 마스킹 로그, 실패는 로그만, 종료 시 최대 10초 drain). `AuthService`는 `enqueue`만 하고 기다리지 않는다. `MailModule`이 `MailDispatcher`를 내보낸다. 통합 테스트는 큐를 비운 뒤 메일을 확인하고, 발송이 멈춘 상태에서도 202가 바로 오는 회귀 테스트 추가.
- 영향: 가입·재발송·재설정 응답이 메일 발송 시간과 무관해졌다. 비정상 종료 시 대기 중 메일이 유실될 수 있다(사용자 재발송, Outbox 도입 시 이전). 재설정·재발송의 남은 차이는 가입된 이메일의 토큰 INSERT 1회(수 ms).
- 검증: api 단위 105개 PASS(발송 큐 6). `npm run test:integration` PASS(55). 실제 서버: signup 202(0.09s), 없는 이메일 재설정 202(0.01s), SIGTERM 시 콘솔 메일 출력 후 정상 종료·오류 없음, 테스트 계정 삭제. `npm run verify` PASS(8/8).
- 주의/롤백: revert로 롤백(동기 발송으로 돌아가며 시간 차 노출이 다시 생긴다). 데이터 영향 없음.

## 2026-11-10 | docs(feature): Feature 목록의 FEAT-003 상태를 Implemented로

- Feature: FEAT-003
- 목적: 직전 커밋에서 목록 표 갱신이 빠졌다(표 정렬로 치환 패턴이 맞지 않음).
- 변경: `docs/features/README.md` FEAT-003 Status Approved → Implemented.
- 영향: 문서만.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-11-10 | feat(auth): 만료 토큰 정리 작업, argon2 OWASP 권장 설정, FEAT-003 완료

- Feature: FEAT-003
- 목적: FEAT-003 마지막 단계. 토큰 행이 계속 쌓이지 않게 정리하고, 작은 서버의 메모리 부족 장애를 막고, 검증 결과를 기록해 기능을 완료한다.
- 변경: `AuthCleanupTask`(매일 03:00 KST, 만료 후 1일 지난 `refresh_tokens`·`email_tokens`를 1000행 단위로 반복 삭제, 실패는 로그만) + `ScheduleModule`. 저장소에 묶음 삭제 raw SQL(`DELETE … WHERE id IN (SELECT … LIMIT n)`, Prisma `deleteMany`는 개수 제한 불가). argon2id를 OWASP 권장 m=19MiB·t=2·p=1로(사용자 결정). Feature 문서 Implemented(AC 체크, `INVALID_ORIGIN` 승인, 구현 결과), Feature 목록, QA 보고서.
- 영향: 비밀번호 해시 1회 메모리 64MiB → 19MiB(동시 4개 기준 약 256MiB → 76MiB). 기존 64MiB 해시도 그대로 검증된다(파라미터가 해시에 저장). 정리 작업은 하루 1회 DB 삭제 쿼리만 추가.
- 검증: `npm run verify` PASS(8/8). api 단위 99개 PASS. `npm run test:integration` PASS(54, cleanup 2 포함 — 기준 시각 경계·묶음 반복 삭제). 빌드한 서버를 띄워 health·signup·콘솔 인증 링크·login·me·refresh 확인 후 테스트 계정 삭제.
- 주의/롤백: revert로 롤백. 데이터 영향 없음(정리 작업은 만료 후 1일 지난 행만 지운다). 여러 인스턴스에서 동시에 돌아도 결과는 같다.

## 2026-11-10 | feat(auth): 가입·이메일 인증·로그인·refresh·로그아웃·비밀번호 재설정 API와 요청 제한

- Feature: FEAT-003
- 목적: FEAT-003 구현 4단계. 이메일/비밀번호 인증의 공개 API를 연다.
- 변경: `AuthController`(signup·email-verification(+resend)·login·refresh·logout·password-reset(+confirm)), `MeController`(`GET /api/me`). `AuthService` — 가입은 항상 해시 1회·메일 1통(새 가입이면 인증, 기존이면 "이미 가입" 안내), 로그인은 없는 계정에도 더미 검증, 재설정은 토큰 사용·비밀번호 교체·이메일 인증·전체 Refresh 폐기를 한 트랜잭션. `AuthRepository` — 가입 `INSERT … ON CONFLICT (email) WHERE email IS NOT NULL DO NOTHING`(raw), 메일 토큰 조건부 사용 처리. 메일 본문(`auth-mail.ts`), 발송 실패는 마스킹 로그만. Refresh 쿠키(`keepio_refresh`, HttpOnly·Secure·SameSite=Lax·Path=/api/auth), refresh·logout의 Origin 검사(403 `INVALID_ORIGIN`, 명세에 추가·승인 대기). 요청 제한 `AuthThrottlerGuard`(IP 분당 10, 로그인 이메일 15분 5, 메일 이메일 시간당 3을 라우트 합산, 429 `TOO_MANY_ATTEMPTS`), refresh·logout은 제외. `setupApp`에 cookie-parser·`trust proxy`(TRUST_PROXY_HOPS). OpenAPI·클라이언트 재생성.
- 영향: 새 공개 API 9개. 메일 발송은 운영에서만 실제 호출(개발 콘솔, 테스트 메모리). 요청 제한은 메모리라 재시작 시 초기화되고 서버를 늘리면 인스턴스별로 센다. 같은 NAT(사무실 등) 뒤 사용자는 IP 제한(분당 10회 로그인)을 함께 쓴다.
- 검증: api 단위 PASS. `npm run test:integration` PASS(52: auth 26, session 10, bookmarks 14, health 2). AC-04 가입 10개 동시(도착 후 일괄) 계정 1개. 변이 검사: 가입 `ON CONFLICT` 제거 시 AC-04 3회 모두 실패, 복구 후 PASS. `npm run verify` PASS(8/8).
- 주의/롤백: revert로 롤백. 데이터는 이 커밋에서 스키마 변경 없음. argon2 기본 파라미터(64MiB)라 동시 해시 수(libuv 스레드 4)만큼 메모리를 쓴다(최대 약 256MiB).

## 2026-11-10 | feat(auth): JWT Guard로 교체하고 Refresh Token 회전·재사용 감지 세션 서비스 추가

- Feature: FEAT-003
- 목적: FEAT-003 구현 3단계. D-11 임시 Guard(개발용 헤더)를 실제 인증으로 바꾸고, 로그인 수단과 무관한 세션 발급·회전·폐기를 만든다.
- 변경: `AccessTokenService`(HS256 고정, iss·aud·15분, sub는 UUID만). `UserGuard`는 Bearer JWT 서명만 검증(DB 조회 없음), `x-dev-user-id` 제거. `SessionService` — issue(새 묶음), rotate(조건부 `updateManyAndReturn` + 새 토큰 INSERT를 저장소 메서드 안 트랜잭션으로, 만료 시각 승계), 유예 10초 후 재사용 시 묶음 폐기, revoke(멱등). `AuthModule`에 `JwtModule`. OpenAPI bearer 보안 스키마와 북마크 `@ApiBearerAuth()`. BACKEND.md(트랜잭션은 저장소 메서드 안에서만, Guard·테스트 토큰 규칙), D-11 종료.
- 영향: 북마크 API가 Access Token 없이는 401. 웹은 아직 토큰을 보내지 않는다(웹 화면·토큰 처리는 별도 작업). 생성 클라이언트 코드는 변경 없음(openapi.json만). `AppModule`을 띄우는 단위 테스트는 `JWT_SECRET`이 필요하다(health 테스트에 stub).
- 검증: api 단위 93개 PASS. `npm run test:integration` PASS(26: bookmarks 14, session 10, health 2). AC-12 20개 동시 회전(도착 후 일괄 진행) 승자 1·묶음 미폐기. 변이 검사: 회전 조건 `usedAt: null` 제거 시 AC-12 3회 모두 실패, 복구 후 PASS. `npm run verify` PASS(8/8).
- 주의/롤백: revert로 롤백(임시 Guard 복원). 데이터 영향 없음. 로그아웃 후 Access Token은 최대 15분 유효(Q-3 수용). AC-17은 현재 북마크 API가 저장뿐이라 저장 경로로만 검증했다.

## 2026-11-10 | feat(api): 인증 테이블 마이그레이션, 이메일·비밀번호·토큰 함수, mail 모듈

- Feature: FEAT-003
- 목적: FEAT-003 구현 2단계. 세션·가입 로직이 기댈 테이블과 순수 함수, 메일 발송 추상화를 먼저 만든다.
- 변경: 마이그레이션 `add_auth` — `users.email`(NULL 허용, 부분 UNIQUE)·`email_verified_at`, `password_credentials`, `refresh_tokens`(family·만료 인덱스), `email_tokens`, enum `email_token_purpose`. SQL CHECK: 이메일은 소문자·trim·3~254자, 토큰 해시 32바이트. 인증 데이터는 사용자 삭제 시 CASCADE. `auth/lib` — 이메일 정규화, 비밀번호 정책(8~128자, 코드 포인트 기준)·argon2id 해시·더미 검증, 256비트 토큰 생성·SHA-256 해시·형식 검사. `common/mask-email`. `mail` 모듈 — `MailSender` 추상 클래스, 운영 Resend(5초 AbortSignal), 개발 콘솔 출력, 테스트 메모리 기록.
- 영향: DB 테이블 3개·enum 1개·`users` 컬럼 2개 추가. 기존 `users` 행은 email NULL. 아직 API에서 쓰지 않는다. `migrate dev`가 비대화형 환경에서 실행되지 않아 마이그레이션은 `migrate diff --from-config-datasource`(최신 상태 개발 DB 기준)로 만들고 CHECK·롤백 블록을 덧붙였다.
- 검증: `npm run db:deploy`·`db:migrate:test` 적용 PASS. 적용 후 `migrate diff` 결과 빈 마이그레이션(CHECK·부분 인덱스 유지) 확인. api 단위(lib·mail·common) 39개 PASS. `npm run verify` PASS(8/8). `npm run test:integration` PASS.
- 주의/롤백: 코드는 revert. DB는 마이그레이션 끝 롤백 블록(테이블 3개·enum drop, `users` 컬럼·인덱스·CHECK drop, `_prisma_migrations` 행 삭제). 운영 데이터 없음.

## 2026-11-10 | chore(api): 인증 의존성 추가와 JWT·메일·프록시 환경 변수 검증

- Feature: FEAT-003
- 목적: FEAT-003 구현의 첫 단계. 의존성과 시작 시 환경 변수 검증(AC-19)을 먼저 넣어 이후 커밋이 기댈 설정을 확정한다.
- 변경: api 의존성 `argon2`·`@nestjs/jwt`·`@nestjs/throttler`·`@nestjs/schedule`·`cookie-parser`·`resend`(+`@types/cookie-parser`), 정확한 버전 고정. `loadEnv`에 `JWT_SECRET`(모든 환경 필수, 32바이트 이상, 기본값 없음), 운영 필수 `WEB_ORIGIN`·`RESEND_API_KEY`·`MAIL_FROM`, `TRUST_PROXY_HOPS`(0~10, 기본 0). CI job env에 테스트 전용 `JWT_SECRET`, turbo `globalPassThroughEnv`에 새 변수. `.env.example`·SETUP 환경 변수 표.
- 영향: 로컬 `.env`에 `JWT_SECRET`이 없으면 api 시작·통합 테스트·openapi 생성이 실패한다(`openssl rand -base64 48`로 추가). 아직 코드에서 새 의존성을 쓰지 않는다. `argon2`는 install script가 npm 정책으로 막혔지만 패키지의 prebuild(darwin-arm64·linux-x64 포함)로 해시·검증 동작을 확인했다.
- 검증: `JWT_SECRET=<임시값> npm run verify` PASS(8/8). `JWT_SECRET=<임시값> npm run test:integration` PASS. api 단위 env·guard 20개 PASS.
- 주의/롤백: revert로 롤백. 데이터 영향 없음.

## 2026-11-10 | docs(auth): FEAT-003 이메일/비밀번호 인증 명세와 로그인 방식 결정 (ADR-011)

- Feature: FEAT-003
- 목적: 사용자가 이메일/비밀번호·소셜·패스키 로그인을 모두 원해 D-04(로그인 제공자/토큰 저장)를 확정하고, 공통 세션 기반이 되는 첫 기능을 명세한다.
- 변경: `auth-email-password.md` Approved(AC 19개, API 9개, 오류 문구, 테이블 3개 추가, 결정 Q-1~Q-7). ADR-011 accepted(직접 조립: JWT Access 15분 + 해시 저장·회전 Refresh 쿠키, Google·Kakao·패스키 순서, Apple은 iOS 출시 시, 메일 Resend). OPEN-QUESTIONS D-04 결정(모바일 저장소만 PoC 후). spec 03 인증 및 보안, spec 04 테이블·API 목록. Feature 목록에 FEAT-003.
- 영향: 문서만. 이후 FEAT-003 구현이 이 명세를 기준으로 한다. 쿠키 전송을 위해 웹·API 같은 사이트 배포가 전제가 된다(D-12 호스팅 결정 시 반영).
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백. FEAT-002 Draft는 별도 브랜치에 있어 번호 FEAT-002를 비워 둔다.

## 2026-10-30 | feat(bookmarks): 링크 저장 API — URL 정규화와 동시 저장 중복 방지

- Feature: FEAT-001
- 목적: `POST /api/bookmarks`로 링크를 저장하고, 같은 링크(정규화 기준)는 동시에 100번 요청돼도 하나만 남게 한다. 첫 도메인 모듈.
- 변경: `users`·`bookmarks` 테이블(UUID, 부분 UNIQUE `(user_id, normalized_url) WHERE deleted_at IS NULL` — Prisma `partialIndexes` preview, 길이 CHECK는 SQL). `bookmarks` 모듈(정규화 순수 함수, `ON CONFLICT DO NOTHING` + 승자 재조회, 201/200, 409 `bookmarkId`). `auth` 모듈(D-11 개발·테스트 전용 `UserGuard`, 운영 항상 401). `ApiException` 추가 필드. OpenAPI·클라이언트 재생성. BACKEND(raw SQL 규칙, 부분 인덱스·CHECK·롤백 블록, 트랜잭션은 필요한 첫 기능에서), QUALITY(동시성 테스트는 경합을 강제), OPERATIONS(수익 전 반복 비용은 사용자 승인), spec 04, AI-LOG 3건.
- 영향: 새 테이블 2개, 북마크당 행 1개·인덱스 2개. 외부 호출 없음. `UserGuard`가 헤더를 믿으므로 인증(D-04) 전에는 배포하지 않는다(운영에서는 항상 401).
- 검증: `npm run verify` PASS(8/8). `npm run test:integration` PASS(14: bookmarks 12, health 2). `npm run build` PASS. api 단위 41개 PASS. AC-03 100개 동시 요청 88~209ms(로컬 6회), 100개 모두 INSERT 도달 assert. `ON CONFLICT` 제거 변이 5회 모두 실패. 스키마 변경 없이 다시 만든 마이그레이션이 비어 있음(Prisma가 CHECK·부분 인덱스를 지우지 않음) 확인 후 삭제.
- 주의/롤백: 코드는 revert. DB는 마이그레이션 끝의 롤백 블록(`DROP TABLE bookmarks; DROP TABLE users;` + `_prisma_migrations` 행 삭제). 운영 데이터 없음. `partialIndexes`는 preview라 Prisma 업그레이드 때 마이그레이션 diff를 확인한다.

## 2026-10-30 | docs(feature): FEAT-001 명세 확정, 기능 구현 단계 시작

- Feature: FEAT-001
- 목적: 사용자 지시로 기본 세팅에서 기능 구현 단계로 전환하고, FEAT-001의 남은 결정을 확정해 승인받는다.
- 변경: AGENTS 현재 단계를 "기능 구현(Phase 1)"으로. `bookmark-save.md` Approved — 추적 파라미터 8개, 입력·정규화 결과 2048자 상한(B-tree 인덱스 항목 한계), 신규 201/기존 200, 오류 문구 표(ADR-009), 빈 값은 INVALID_URL·필드 없음은 VALIDATION_FAILED. spec 04 URL 정책에 같은 내용.
- 영향: 문서만. 이후 FEAT-001 구현이 이 명세를 기준으로 한다.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백. 추적 파라미터 목록을 바꾸면 기존 저장분의 정규화 결과가 달라진다.

## 2026-10-30 | docs(git): PR은 목적 단위로 묶고 배포 전에는 승격하지 않음 (ADR-010)

- Feature: N/A
- 목적: 작은 정리마다 PR을 열어 merge 부담이 크고 동시 PR끼리 HISTORY가 충돌했다. 배포 환경이 없어 승격 PR은 하는 일이 없다(사용자 결정).
- 변경: `BRANCHING.md` 10번(기능·요청 묶음 = 브랜치 하나 = PR 하나, 열린 PR이 같은 목적이면 커밋 추가), 환경 절(배포 환경 전 승격 중단). ADR-010.
- 영향: 이후 작업 흐름만. 작업 브랜치 → `dev` PR·CI 필수·보호 규칙은 그대로. `stg`는 승격 재개 때까지 `dev`보다 뒤처진다.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | fix(git): AI 작성자 표시 검사가 생성 문구를 링크 형태로만 잡도록

- Feature: N/A
- 목적: 직전 커밋의 첫 CI에서 PR 본문의 패턴 설명(링크 없는 "Generated with [Claude")이 오탐으로 실패했다.
- 변경: `check-ai-attribution.sh` 생성 문구 패턴에 링크(`](http`)를 요구. 실제 자동 표시는 항상 `Generated with [Claude Code](https://…)` 형태다.
- 영향: 규칙을 설명하는 PR·커밋 본문이 통과한다. trailer 검사는 그대로.
- 검증: 메시지 fixture 10개 기대대로(차단 5 / 통과 5, 링크 없는 생성 문구 설명 추가). 실제 PR #22 제목·본문 `--stdin` 통과. `origin/dev` 전체 검사는 여전히 28개 탐지.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | chore(git): 커밋·PR의 AI 작성자 표시를 hook과 CI로 차단

- Feature: N/A
- 목적: GitHub 기여자 그래프에 claude가 다시 올라가지 않게 한다(사용자 결정: 무조건 차단). PR #11의 설정(`attribution`)은 Claude Code 자동 표시만 끄므로, AI가 직접 쓰거나 다른 환경에서 커밋하면 다시 들어갈 수 있었다. squash merge는 PR 커밋 메시지를 그대로 dev 커밋에 옮긴다.
- 변경: `scripts/check-ai-attribution.sh`(줄 맨 앞의 `Co-Authored-By: …claude/anthropic` trailer, `Generated with [Claude` 링크 문구 탐지, 대소문자 무시). `.githooks/commit-msg`. CI에 PR 커밋·제목·본문 검사 단계. `BRANCHING.md` AI 에이전트 규칙, `QUALITY.md` 로컬 게이트, AI-LOG 1건(표 열 너비 재정렬 포함).
- 영향: 이후 모든 커밋과 PR. dev에 이미 있는 커밋은 CI 검사에서 제외한다 — 제외하지 않으면 표시 금지 전 커밋(`stg`에만 있는 #9)이 다음 stg→prod 승격 PR을 영구히 막는다. 기존 28개 커밋의 표시와 그래프 숫자는 그대로 남는다(히스토리 재작성 안 함).
- 검증: 첫 커밋 시도에서 이 커밋 본문의 설명 문장("Co-Authored-By: Claude 등을 거부한다")이 오탐으로 거부됨 → 줄 시작 고정으로 수정. 메시지 fixture 9개 기대대로(차단 5: 표준 trailer·소문자·Generated 링크·anthropic 이메일·들여쓴 trailer / 통과 4: 주석 줄·본문의 "Claude Code" 단어·사람 공동 작성자·규칙 설명 문장). 실제 이력: `origin/stg --not origin/prod`는 231e3b2로 실패, `origin/dev`를 제외하면 통과, `origin/dev` 전체는 28개 모두 탐지. `--stdin` 통과·차단 확인. trailer를 넣은 실제 `git commit`이 commit-msg hook에서 거부되고 HEAD가 그대로임을 확인. `npm run format:check` PASS. CI 단계는 이 PR에서 처음 실행.
- 주의/롤백: revert로 롤백. 검사가 오탐하면 hook을 우회하지 말고 패턴을 고친다.

## 2026-10-30 | feat(api): 오류 응답 message를 사용자 문구로 (ADR-009)

- Feature: N/A
- 목적: 프론트가 오류 문구를 만들거나 바꾸지 않고 서버 `message`를 그대로 보여주게 한다(사용자 결정). 문구를 한 곳에서 관리하고, 서버가 권위 있는 값을 주는 원칙과 맞춘다.
- 변경: `api-exception.filter.ts`의 고정 문구(검증 실패·404·500)를 한국어 사용자 문구로 바꾸고, 도메인 예외가 아닌 HTTP 예외는 Nest 원래 메시지 대신 공통 문구를 쓴다. `ApiErrorResponse.message`에 OpenAPI 설명 추가 → `openapi:generate`. ADR-009, `BACKEND.md` Errors, `FRONTEND.md` Errors, `FEATURE-TEMPLATE.md` 오류 문구 표.
- 영향: 모든 오류 응답의 `message` 값이 바뀐다(`code`·형태는 그대로). 현재 `message`를 읽는 클라이언트 코드는 없다. 이전에 그대로 나가던 비도메인 HTTP 예외 메시지가 더 이상 노출되지 않는다.
- 검증: `npm run test:related -w @keepio/api` PASS(2 files, 9 tests, 403 비노출 테스트 추가). `npm run verify` PASS(8/8). 통합 테스트는 로컬 미실행(DB 쿼리 변경 없음, CI에서 실행).
- 주의/롤백: revert로 롤백. 문구는 계약이 아니므로 테스트·클라이언트가 문구로 분기하지 않는다.

## 2026-10-30 | docs(standards): 백엔드 모듈 구조·마이그레이션·테스트 관례 정리

- Feature: N/A
- 목적: 첫 도메인 모듈(FEAT-001) 전에 `apps/api` 안에서 모듈을 어디에 어떻게 만들지 문서로 고정한다. 지침 점검에서 찾은 공백과 불일치를 정리한다(사용자 승인).
- 변경: `BACKEND.md`에 Structure(`src/<domain>/` 평면 배치 — 기존 `health`·Nest CLI 기본과 같음, 파일 역할·이름, service는 repository 경유, 모듈 간 `exports`만 사용, 사용자 식별은 guard+decorator)와 Migrations and tests(raw SQL 제약은 같은 마이그레이션에, 적용된 마이그레이션 수정 금지, down 없음 → 롤백은 HISTORY에) 추가. 모듈 목록은 spec 03을 원본으로. 트랜잭션 전달 방식·롤백 기록 형식은 FEAT-001에서 정해 반영. `FRONTEND.md` 버전 표기를 메이저만(실제 React 19.3.1과 어긋나 있었음). spec 03 폴더 구조에 아직 없는 `worker`·`mobile`·`shared`를 `(예정)`으로 표시.
- 영향: 문서만. git 미추적 빈 폴더 `apps/api/src/modules/health`를 로컬에서 삭제(커밋 영향 없음).
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | docs(decisions): spec·standards를 최종 상태로, ADR은 변경 이유 기록
- Feature: N/A
- 목적: ADR이 쌓여도 spec·standards만 읽으면 현재 규칙을 알 수 있게 한다(사용자 결정, ADR-008).
- 변경: AGENTS.md·docs/README.md 우선순위 문구 변경. ADR-001~007을 spec·standards와 대조해 빠진 두 건 반영: spec 03 검증(class-validator)·테스트(Vitest+SWC), PRD "MVP 제외"에 버킷 중첩·비교/결정 화면. ADR-008 추가.
- 영향: 문서만. 이후 결정 변경 PR은 spec·standards 본문도 함께 고친다.
- 검증: Prettier 검사(pre-commit). 문서 전용이라 verify 미실행.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | chore(claude): .env 읽기·--no-verify를 permissions.deny로 차단
- Feature: N/A
- 목적: AGENTS에 문장으로만 있던 금지(비밀 파일 읽기, hook 우회)를 Claude Code 설정으로 실행 단계에서 막는다. 토큰·보안 강의 내용 중 과하지 않은 것만 적용(사용자 결정). sandbox·AGENTS 축약·HISTORY 읽기 hook·서브에이전트·headless는 보류.
- 변경: `.claude/settings.json` `permissions.deny`에 `Read(./.env)`, `Read(./apps/*/.env.local)`, `git commit --no-verify`/`-n`, `git push --no-verify`. `BRANCHING.md` 9번(HISTORY 충돌 시 rebase + `--force-with-lease`). AI-LOG 3건.
- 영향: Claude Code 세션만. 사람의 터미널 작업과 CI는 그대로. deny는 등록한 형태만 막으므로 최종 기준은 계속 CI다.
- 검증: 설정 적용 후 같은 세션에서 Read(.env) 거부, Bash `head -c 0 .env` 거부, 스테이징 없는 상태의 `git commit --no-verify` 거부 확인. Prettier 검사. 코드 변경 없어 verify는 pre-commit 범위만.
- 주의/롤백: revert로 롤백.

## 2026-10-30 | fix(harness): 세팅 검증에서 찾은 게이트 공백 7건
- Feature: N/A
- 목적: 기능 구현 전 세팅 검증(사용자 요청)에서 찾은 공백을 게이트로 막는다. 결과: `docs/qa/TEST-REPORT.md`.
- 변경: web 경계 lint를 `no-restricted-imports` 문자열 패턴에서 `import/no-restricted-paths`(해석된 경로, basePath 고정, feature 목록은 `src/features` 폴더에서 생성)로 교체 — G1·G2·G3 차단, G7 오탐 해소. `eslint-plugin-import` 2.32.0을 web 직접 devDependency로 추가(이미 eslint-config-next 경유 설치, 사용자 승인). pre-commit이 HISTORY 검사 실패 이유를 출력(G4). `ci-scope.sh` 전체 검사 조건에 `prisma.config.ts`·`.nvmrc` 추가(G5·G6). `FRONTEND.md` Boundaries 갱신, AI-LOG 3건.
- 영향: 같은 feature 안의 `@/features/<self>/...` 별칭 import는 더 이상 막히지 않는다(AGENTS 규칙은 "다른 기능"만 금지). 에디터 ESLint는 새 feature 폴더를 만든 뒤 재시작해야 경계가 반영된다(CLI·hook·CI는 매번 새로 읽음). `.nvmrc`·`prisma.config.ts` 변경 PR은 CI 전체 검사로 시간이 늘어난다.
- 검증: 경계 fixture 15개(차단 7·통과 8) 기대대로, apps/web/src cwd에서 basePath 효과 확인(없음 0건/있음 3건). G4 메시지 출력 확인. scratch worktree에서 G5·G6 전체 검사, web만·docs만 회귀 확인. `npm run verify` PASS(8/8, web lint 포함 3개 새로 실행). `npm run build` PASS(3/3). 통합 테스트는 로컬 미실행(api 코드 변경 없음, CI에서 실행).
- 주의/롤백: revert로 롤백. 롤백하면 G1~G7이 다시 열린다.

## 2026-10-30 | chore(github): PR 템플릿 추가와 레포 설명 통일
- Feature: N/A
- 목적: PR 본문 형식을 고정해 설계 근거와 실측 결과가 PR마다 남게 한다. GitHub 레포 설명이 README·스펙의 서비스 정의와 달라 README 기준으로 맞춘다(사용자 결정).
- 변경: `.github/pull_request_template.md`(목적·변경 요약·설계 결정과 근거·검증·측정·위험/롤백). `BRANCHING.md` PR 본문 항목을 템플릿과 맞춤. GitHub 레포 설명을 README 첫 문장으로 변경(git 밖 설정).
- 영향: 이후 웹에서 여는 PR 본문 기본값. 코드·CI 영향 없음.
- 검증: Prettier 검사(pre-commit). 레포 설명은 `gh repo view`로 확인. 이 PR 본문을 템플릿 형식으로 작성(`gh pr create`는 템플릿을 자동 적용하지 않으므로 웹 PR 화면의 기본값 적용은 미확인).
- 주의/롤백: revert로 롤백. 레포 설명은 `gh repo edit --description`으로 되돌린다.

## 2026-10-29 | docs(learning): 초기 세팅 학습 노트 01
- Feature: N/A
- 목적: 사용자 요청 — 기본 세팅 완료 시점의 구조를 파트별(공통·web·api·api-client·게이트·Git·의존성·배포·AI 하네스)로 학습용 정리.
- 변경: `docs/learning/01-initial-setup.md`(스냅샷 문서, dev f8065b6 기준). 규칙은 복사하지 않고 원본 문서·코드로 링크. `docs/README.md`에 학습 노트 목록 추가.
- 영향: 문서만. 낡으면 새 노트를 추가하고 기존 노트는 고치지 않는다.
- 검증: 문서의 상대 링크 전부 존재 확인(스크립트). PR #14 merge 후 Dependabot undici 경보 8건 모두 fixed 확인(API). pre-commit만 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(deps): Dependabot에서 @types/node·TypeScript·ESLint 메이저 제외
- Feature: N/A
- 목적: #5(@types/node 26)·#4(TypeScript 7)·#6(ESLint 10)은 보류·불일치로 닫는다. 같은 PR이 매주 다시 열리지 않게 한다(사용자 결정).
- 변경: `dependabot.yml` npm `ignore`에 세 패키지의 semver-major.
- 영향: 세 패키지의 minor·patch는 계속 제안된다. 메이저는 별도 검토 작업으로 올린다(TypeScript 7은 ESLint 플러그인 호환, ESLint 10은 eslint-config-next 지원 확인 필요).
- 검증: Prettier 검사. Dependabot 반영은 다음 주간 실행에서 확인(미실행).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(deps): jsdom 30, @types/node 24(Node 버전 정합), React 19.3.1 단일화
- Feature: N/A
- 목적: Dependabot #7(jsdom) 반영. #5(@types/node 26)는 고정 Node 24와 맞지 않아 닫고, 기존 web의 `^20`도 Node 24와 어긋나 있어 24로 맞춘다(사용자 결정). 직전 커밋의 React 19.3.0이 peer 해결로 두 벌 설치되는 문제를 고친다.
- 변경: web jsdom 28.1.0→30.1.2(요구 Node `^24.15.0` 충족), web @types/node `^20`→24.19.2, api `^24.19.2`→24.19.2(정확한 버전). react·react-dom 19.3.0→19.3.1(web·api-client, 공개 15일) — lock의 react 계열 항목을 지우고 재설치해 루트 한 벌만 남김. AI-LOG 2건.
- 영향: web·api-client·테스트 환경. 런타임 React 사본 1개.
- 검증: lock에 react·react-dom 19.3.1 루트 1벌만 존재 확인. `npm run verify` PASS(8/8, format·openapi:check 포함). `npm run build` PASS(3/3). 통합 테스트는 로컬 미실행(api 코드 변경 없음, CI에서 실행).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(deps): minor·patch 7개(turbo 2.11, React 19.3, testing-library)
- Feature: N/A
- 목적: Dependabot #3 반영.
- 변경: turbo 2.9.18→2.11.8, react·react-dom 19.2.4→19.3.0(web·api-client), @types/react 19.3.0, @types/react-dom 19.3.0, @testing-library/react 16.3.3, @testing-library/user-event 14.6.8. 이번에 올린 패키지는 범위(`^2`, `^19`, `^16.3.2` 등)를 정확한 버전으로 고정(의존성 정책).
- 영향: web·api-client·빌드 도구. Next 16.4.3의 peer `react ^19.0.0` 충족. 모든 버전 공개 16~63일.
- 검증: 버전별 공개일 npm 조회, `npm ls` invalid·UNMET 없음. verify·build는 이 브랜치 마지막 커밋에서 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(ci): actions/checkout·setup-node v4 → v7
- Feature: N/A
- 목적: Dependabot #1·#2 반영(한 브랜치로 모아 HISTORY 충돌·반복 CI를 피한다, 사용자 결정).
- 변경: `ci.yml`의 `actions/checkout@v7`, `actions/setup-node@v7`.
- 영향: CI만. checkout v7의 깨지는 변경은 `pull_request_target`·`workflow_run`에서 fork PR 체크아웃 차단 — 이 저장소는 사용하지 않는다. setup-node v7은 ESM 전환·캐시 출력 추가.
- 검증: 릴리스 노트(v5~v7) 확인. 실제 동작은 이 브랜치 PR의 CI로 확인.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | fix(deps): undici 7.29.1 취약점 해소(orval 경유, 범위 지정 override)
- Feature: N/A
- 목적: Dependabot 경보 5건(undici 7.x < 7.30.1, high 4·medium 1). 취약 버전은 orval 8.43.0 → `@scalar/json-magic@0.15.7` 경로에만 있다(개발용 코드 생성 도구, 서버 미포함). #12는 orval을 4일 된 8.45.0(`^` 범위)으로 올려 14일·정확한 버전 규칙에 어긋나므로 닫는다(사용자 결정).
- 변경: 루트 `overrides`에 `"@scalar/json-magic@0.15.7": { "undici": "7.30.1" }`(7.30.1은 공개 14일). lock에서 해당 경로 7.29.1 항목 제거 후 재설치.
- 영향: dev 의존성만. orval 8.43.0 유지. `@scalar/json-magic@0.17.0`의 undici 8.12.3(패치 버전 8.12.2 이상)은 그대로.
- 검증: `npm ls undici --all`에서 7.29.1 사라짐, 0.15.7 경로 7.30.1, 8.12.3 경로 불변 확인. 첫 시도(`orval > @scalar/json-magic` 중첩 override)는 8.12.3 경로까지 7.30.1로 끌어내려 invalid가 되어 버전 지정 키로 바꿈. verify·openapi:check는 이 브랜치 마지막 커밋에서 실행. 승격 PR #13(dev→stg) — PR 경로·HISTORY 보존 검사·verify 통과, stg merge 방식 merge commit만 허용 API로 확인, 사용자 merge(974e1c1).
- 주의/롤백: orval을 올릴 때 이 override가 불필요해지면 제거한다. revert로 롤백.

## 2026-10-29 | chore(claude): 커밋·PR의 AI 작성자 표시 끄기
- Feature: N/A
- 목적: 사용자 결정 — 커밋·PR에 Claude 공동 작성자·"Generated with" 표시를 남기지 않는다. AI 하네스(AGENTS·게이트·AI-LOG) 자체는 포트폴리오 사례로 유지하고, 과거 커밋 이력은 다시 쓰지 않는다.
- 변경: `.claude/settings.json`에 `attribution.commit`·`attribution.pr` 빈 값. `/finish` 커밋 메시지 초안에서 attribution 항목 제거(표시를 넣지 않는다고 명시).
- 영향: Claude Code가 만드는 커밋·PR에 작성자 표시가 붙지 않는다. 코드·CI 영향 없음.
- 검증: `jq -e .attribution .claude/settings.json`로 JSON·값 확인. 실제 커밋에 표시가 붙지 않는지는 이 커밋 메시지로 확인. PR #9 merge(231e3b2) 확인 — squash 메시지에 기존 커밋의 공동 작성자 줄이 남았고 과거 이력 유지 결정에 따라 그대로 둠.
- 주의/롤백: 설정은 Claude Code 세션 재시작 후 반영될 수 있다. revert로 롤백.

## 2026-10-29 | docs(git): 브랜치 전략 PR 검증 결과, 검증용 PR 분리 규칙
- Feature: N/A
- 목적: 직전 항목(ADR-007)에서 PR로 미룬 검증 결과를 기록하고, 검증 중 생긴 AI 실수를 규칙으로 막는다.
- 변경: BRANCHING.md AI 에이전트 절에 "검증용 PR은 별도 브랜치·커밋" 1줄. AI-LOG 1건.
- 영향: 문서만. 이 커밋으로 PR #9의 필수 체크 막힘이 풀린다(새 커밋에는 #9 CI 결과만 붙음).
- 검증: PR #9(작업 브랜치→dev) CI `verify` 통과, 처음 merge 상태 CLEAN. 임시 PR #10(작업 브랜치→stg)은 "chore/branch-strategy → stg 는 허용되지 않는 경로다(ADR-007)"로 실패·BLOCKED 확인 후 닫음. GitHub API로 dev 규칙 deletion·non_fast_forward·pull_request·required_status_checks 활성 확인. #10이 같은 커밋을 써서 #9도 BLOCKED가 됐고, #9 CI 재실행(통과)으로는 풀리지 않음을 확인. dev→stg 승격 PR은 #9 merge 후 미실행(대기).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | chore(git): dev·stg·prod 브랜치 전략과 PR 필수화, 보안 설정 (ADR-007)
- Feature: N/A
- 목적: main 직접 push 구조라 CI 실패 코드도 들어갔다. 실무 흐름(작업 브랜치→dev→stg→prod)을 프로젝트 규칙으로 고정하고 CI 통과를 merge 조건으로 강제한다(사용자 결정). public 저장소인데 비밀값 감지가 꺼져 있었다.
- 변경: 규칙 `docs/standards/BRANCHING.md`, ADR-007. `ci.yml` 트리거를 dev·stg·prod 대상 PR·주간·수동으로(push 재실행 제거), PR 경로 검사 단계 추가. pre-commit이 보호 브랜치(dev·stg·prod·main) 커밋 차단. AGENTS(작업 브랜치·사용자 merge), `/finish`(push·PR 별도 승인, merge 안 함), HARNESS-PLAN·QUALITY·SETUP. GitHub: main→dev 이름 변경(기본 브랜치), stg·prod 생성, ruleset 2개(dev: squash만 / stg·prod: merge commit만, 공통 PR 필수·`verify` 필수·강제 push·삭제 금지·승인 미요구·우회 없음). Secret scanning·push protection·취약점 알림·Dependabot 보안 업데이트 켬.
- 영향: 보호 브랜치 직접 push 불가, 모든 변경은 PR. CI는 PR당 1회. 서버 비용 없음(환경은 D-12).
- 검증: pre-commit을 로컬 `stg` 브랜치에서 실행해 차단(exit 1), 작업 브랜치에서는 통과 경로 확인. GitHub API로 기본 브랜치 dev, ruleset 2개 생성, 보안 설정 enabled 응답 확인. 이 PR의 CI 필수 체크·승격 PR·잘못된 경로 PR 결과는 PR에서 확인 후 다음 항목에 기록.
- 주의/롤백: 로컬 클론은 `git branch -m main dev && git branch -u origin/dev dev` 필요. 롤백은 ruleset 삭제, dev→main 이름 변경, `ci.yml` 트리거 복원.

## 2026-10-29 | docs(agents): 비용이 필수 요소를 줄이는 근거가 아님을 명시
- Feature: N/A
- 목적: 사용자 지시 반영 — 비용 최적화가 보안·정확성 같은 필수 요소까지 줄이는 근거로 읽히지 않게 한다.
- 변경: AGENTS.md "지시 범위와 목표"에 1줄 추가 — 필수 요소(보안, 데이터 무결성, 정확성, 장애 대응용 로그·백업·관측, 접근성)는 빼거나 줄이지 않고 더 효율적인 방법을 찾으며, 애매하면 사용자에게 묻는다.
- 영향: 문서만.
- 검증: 문서 전용, pre-commit만 실행. 직전 커밋에 amend하려 했으나 HISTORY 보존 검사가 기존 항목 수정을 막아 별도 커밋으로 남김(검사 의도대로 동작).
- 주의/롤백: revert로 롤백.

## 2026-10-29 | docs(agents): 미지시 작업 사전 확인, 올바른 코드·성능 우선, 서버 자산 비용 영향 명시
- Feature: N/A
- 목적: 사용자 지시 반영 — 지시하지 않은 작업은 크기와 관계없이 먼저 묻고, 구현 완료보다 올바른 코드·성능을 우선하며, 서버 자산 전체를 비용으로 고려한다. 기존 지침은 큰 변경만 승인 대상이었고 비용은 캐시 위주로만 적혀 있었다.
- 변경: AGENTS.md "지시 범위와 목표" 3줄. TASK-TEMPLATE에 "비용 영향" 항목 분리(`/task` 계획 양식). 폴더 구조는 검토 후 현행(`apps/`·`packages/`) 유지로 결정 — 변경 없음.
- 영향: 문서만.
- 검증: 문서 전용, pre-commit만 실행. 직전 항목(ci: 바뀐 패키지만 검사)의 GitHub 실행 결과 보충 — main push(78e3431) 전체 검사 PASS, web만 바꾼 임시 PR #8에서 web만 검사·DB 통합 건너뜀 PASS(1분 15초), PR은 merge 없이 닫고 브랜치 삭제.
- 주의/롤백: revert로 롤백.

## 2026-10-29 | ci: 바뀐 패키지만 검사(turbo --affected), 주 1회·수동 전체 검사
- Feature: N/A
- 목적: web·api(이후 모바일)가 한 저장소에 있어 CI가 매 push마다 전체를 검사했다. 로컬(pre-commit=staged 파일, verify=turbo 캐시)은 이미 변경 범위만 돌고 있었다.
- 변경: `scripts/ci-scope.sh`(비교 기준·전체 검사 조건 판단, turbo 인자와 api 포함 여부 출력). `ci.yml`에 범위 단계, verify·통합·build에 `--affected`, DB 마이그레이션·통합 테스트는 api 범위일 때만, `schedule`(월 03:00 KST)·`workflow_dispatch` 전체 검사. HARNESS-PLAN CI 정책, QUALITY 표.
- 영향: CI만. web만 바꾸면 api lint·typecheck·test·build·DB 통합을 건너뛴다. format:check·openapi:check는 매번 전체.
- 검증: turbo 2.9.18에서 변경별 affected 확인 — web 파일→web, api 파일→api, api-client→api-client·web, turbo.json→전체, docs·prisma→없음(그래서 prisma는 전체 검사로 처리). 스크립트를 기준 없음·0 커밋·문서만·CI 변경 커밋으로 실행해 기대 출력 확인. web만 바꾼 상태의 build dry-run에 api 제외, 범위가 비었을 때 turbo exit 0 확인. GitHub Actions 실행 결과는 push 후 확인.
- 주의/롤백: turbo는 api 변경을 web에 연결하지 않는다(생성 코드 경유) — openapi:check가 매번 전체로 이 연결을 검사한다. 놓친 경우는 주간 전체 검사로 잡는다. revert로 롤백.

## 2026-10-28 | docs(readme): 현재 상태를 기본 세팅 완료 기준으로 갱신
- Feature: N/A
- 목적: README "현재 상태"가 초기 스켈레톤 기준(web 빈 페이지·테스트 1개, packages 없음)에 머물러 실제와 달랐다.
- 변경: 단계(기본 세팅 완료, 보류 항목 D-08·D-09·D-12), web Provider·API 주소, api ADR-006, `packages/api-client` 항목 추가.
- 영향: 문서만.
- 검증: 저장소 파일(`apps/`, `packages/`, ADR 목록)과 대조. pre-commit만 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-28 | docs(agents): Anti-Laziness·Anti-Hallucination 규칙, 현재 단계(기본 세팅) 명시, 배포·모바일·디자인 보류
- Feature: N/A
- 목적: 사용자 지시 반영 — 근거 확인·완전 구현·실제 검증·최종 보고 규칙을 AI 공통 규약에 추가하고, 지금은 기본 세팅 단계임을 AI가 읽는 문서에 고정한다.
- 변경: AGENTS.md에 "Anti-Laziness & Anti-Hallucination" 절(사용자 제공 원문)과 현재 단계 문단 추가. `/finish` 최종 보고 항목을 Final Report 형식에 맞춤. OPEN-QUESTIONS D-08(모바일 구현 단계에서)·D-09(사용자가 직접 세팅) 보류 표시, D-12(배포 호스팅·CD, 맨 마지막) 추가. HARNESS-PLAN CI 계획에서 배포를 D-12 이후로.
- 영향: 문서·스킬 정의만. 기존 CI(검사)는 유지.
- 검증: 문서 전용, pre-commit만 실행.
- 주의/롤백: "현재 단계" 문단은 기능 구현을 시작할 때 갱신해야 한다. revert로 롤백.

## 2026-10-28 | feat(web): TanStack Query Provider·기본 정책, API 주소 설정
- Feature: N/A
- 목적: 첫 화면 기능이 바로 생성된 api-client 훅을 쓸 수 있게 하고, 요청 정책을 한곳에서 고정한다(FRONTEND.md Network / state).
- 변경: `app/query-client.ts`(refetchOnWindowFocus false, 쿼리 retry 1, 뮤테이션 retry 0, 캐시 수치는 기본값), `app/providers.tsx`(컴포넌트 수명당 QueryClient, `configureApiClient`, 운영 빌드에서 `NEXT_PUBLIC_API_BASE_URL` 없으면 실패), layout에 Providers. web 의존성 `@tanstack/react-query` 5.104.3·`@keepio/api-client`, `transpilePackages`. `apps/web/.env.example`, CI에 검증용 API 주소, SETUP 설치 단계·문제 해결 1행, FRONTEND 정책 1줄.
- 영향: 화면 변화 없음. web 운영 빌드에 `NEXT_PUBLIC_API_BASE_URL` 필요.
- 검증: web 테스트 2개 PASS(Providers 기본 정책 포함). turbo로 환경 변수만 넘긴 빌드 PASS, 값 없이 빌드 시 의도대로 실패 확인. `npm run build` PASS(3/3), `npm run verify` PASS(8/8).
- 주의/롤백: staleTime 등 캐시 수치는 측정 후 결정. revert로 롤백.

## 2026-10-28 | feat(api): 공통 오류 응답·요청 ID·접근 로그·환경 변수 검증 (ADR-006)
- Feature: N/A
- 목적: 기능 구현 전에 모든 API가 공유할 오류 계약·관측성·설정 검증을 고정한다.
- 변경: `common/api-error.ts`(`ApiErrorResponse`, `ApiException`), `common/api-exception.filter.ts`(전역 필터), `common/request-context.ts`(x-request-id 검증·생성, AsyncLocalStorage, 쿼리 제외 접근 로그), `config/env.ts`(`loadEnv`). main은 `loadEnv`·운영 JSON 로거, PrismaService는 `loadEnv` 사용. `/health` DB down은 예외 대신 503 상태로 같은 본문. OpenAPI에 `ApiErrorResponse` 추가 → api-client 재생성. `@types/express` 5.0.6 추가. ADR-006, BACKEND 규칙 2줄, `.env.example` NODE_ENV, FEAT-001 오류 형태 참조, AI-LOG 1건.
- 영향: 모든 오류 응답 본문 형태 변경(소비자 없음). `/health` 응답 형태·상태 코드 유지.
- 검증: api 단위 12개 PASS(env 4, 오류·요청 ID 5, health 3), 통합 2개 PASS(실제 PG). 404 쿼리 미노출 테스트가 수정 전 코드에서 실패함을 확인. 운영 모드 실제 기동 — JSON 로그, 접근 로그 쿼리 제외, `/health` 200, 잘못된 DATABASE_URL로 exit 1·비밀값 미출력. `npm run verify` PASS(8/8).
- 주의/롤백: 로그 수집 서비스는 미정(배포 단계). `setup-app.ts`에서 필터·미들웨어 제거로 롤백.

## 2026-10-28 | chore(deps): Dependabot 주간 업데이트, 공개 14일 경과 릴리스만
- Feature: N/A
- 목적: 수동으로 지키던 "공개 직후 버전 회피" 원칙을 자동화하고, 보안 패치가 방치되지 않게 한다.
- 변경: `.github/dependabot.yml`(npm 주간·minor/patch 묶음·PR 최대 5개, github-actions 월간, 둘 다 `cooldown` 14일). standards/HISTORY에 Dependabot PR도 HISTORY 항목 필수(리뷰어가 추가) 명시, OPERATIONS에 의존성 정책 1줄.
- 영향: push 후 GitHub이 매주 PR을 연다. 머지 전 CI와 HISTORY 항목이 필요하다.
- 검증: Prettier 검사. Dependabot 설정 유효성은 push 후 GitHub의 Dependabot 탭에서 확인 필요(미실행).
- 주의/롤백: Dependabot이 PR 브랜치에 사람이 커밋하면 자동 rebase를 멈춘다(충돌 시 `@dependabot recreate`). 파일 삭제로 롤백.

## 2026-10-28 | docs(harness): HARNESS-PLAN을 현재 상태로 갱신, blame 제외 커밋 등록
- Feature: N/A
- 목적: 계획 단계에 머물러 있던 하네스 문서를 실제 구현과 남은 일 기준으로 맞추고, 일괄 포맷 커밋이 `git blame`을 가리지 않게 한다.
- 변경: HARNESS-PLAN 단계별 상태 표·현재 CI 정책(브랜치 보호 미적용 명시). `.git-blame-ignore-revs`(f99f5f3), `prepare`에서 `blame.ignoreRevsFile` 설정.
- 영향: 문서·로컬 git 설정만.
- 검증: `npm run prepare` 후 `git config blame.ignoreRevsFile` 값 확인. pre-commit 실행.
- 주의/롤백: GitHub 웹 blame은 저장소 루트의 같은 파일을 자동 인식한다. revert 후 `git config --unset blame.ignoreRevsFile`.

## 2026-10-28 | feat(api-client): OpenAPI 내보내기, Orval 클라이언트 생성, 명세 불일치 게이트 (Phase 0-2)
- Feature: N/A
- 목적: 웹이 API 응답을 추측하지 않고 생성된 타입·훅만 쓰게 하고, 코드와 명세가 어긋나면 verify에서 막는다(ADR-005).
- 변경: api `createOpenApiDocument` 분리, `openapi-export.ts`(Nest preview 모드, DB 불필요). `packages/api-client`(Orval 8.43.0 react-query+fetch, mutator `apiFetch`, 생성물 커밋, typecheck). 루트 `openapi:generate`(turbo로 api 빌드 → 내보내기 → 생성 → prettier), `openapi:check`(`scripts/check-openapi.sh`, 해시 비교) → verify에 포함. ADR-005, FRONTEND(Next 16.4.3 표기 정정, 클라이언트 규칙)·BACKEND·SETUP·README 갱신, ADR-003에 "위반 예제는 검증 대상 게이트까지 도달" 원칙 추가, AI-LOG 2건.
- 영향: verify가 api 빌드를 포함해 몇 초 늘어남. 웹 소비 코드·QueryClientProvider는 아직 없음(첫 소비 기능에서 정책과 함께 추가). 새 의존성 orval 8.43.0, @tanstack/react-query 5.104.3(peer) — 둘 다 공개 약 2주 경과 버전으로 고정.
- 검증: `npm run verify` PASS(8/8), `npm run build` PASS(3/3). `HealthResponse`에 선택 속성 추가 후 재생성 없이 `openapi:check` exit 1, 복원 후 exit 0. Prisma 생성 코드를 지운 깨끗한 상태에서 `openapi:check` 통과(turbo가 db:generate 선행). 2회 연속 생성 결과 동일(결정적).
- 주의/롤백: Node는 nvm v24.22.1 사용(셸 기본 v24.19.0은 engine-strict로 거부). 생성물 손수정 금지. revert로 롤백.

## 2026-10-28 | docs: D-01(삭제 URL 재저장 → 409 복구 안내)·D-11(임시 사용자 Guard) 결정 반영
- Feature: FEAT-001
- 목적: FEAT-001 구현을 막던 정책 두 가지를 사용자 결정으로 확정한다.
- 변경: OPEN-QUESTIONS D-01·D-11 결정 기록, PRD 비즈니스 규칙 1줄, spec 04 URL 정책 문장 확정, FEAT-001 AC-07 확정·미확정 목록 축소(추적 파라미터·길이 상한, 신규/기존 응답 구분 2건 남음).
- 영향: 문서만. 409 응답은 FEAT-001에서 새 계약으로 추가된다.
- 검증: 문서 전용, pre-commit만 실행.
- 주의/롤백: revert로 롤백.

## 2026-10-28 | docs: FEAT-001 링크 저장 명세 초안, D-10 백오피스·D-11 임시 사용자 식별 등록
- Feature: FEAT-001
- 목적: 첫 도메인 기능의 수용 기준과 미결정을 구현 전에 고정하고, 백오피스 논의를 결정 대기 목록에 남긴다.
- 변경: `docs/features/bookmark-save.md`(Draft, AC-01~07, 미확정 4건), features README 목록, OPEN-QUESTIONS에 D-10(백오피스 범위·시점)·D-11(인증 전 사용자 식별) 추가.
- 영향: 문서만. FEAT-001 구현은 D-01·D-11 결정과 승인 후.
- 검증: 문서 전용, pre-commit만 실행.
- 주의/롤백: 응답 형태·추적 파라미터 목록은 미확정으로 표시(추측 금지). revert로 롤백.

## 2026-10-28 | chore(skill): /task가 현재 git 상태와 기존 파일을 먼저 확인하도록 보강
- Feature: N/A
- 목적: 대화 기억에 의존해 이미 끝난 작업을 다시 계획하고 기존 파일을 덮어쓴 실수의 재발 방지.
- 변경: `.claude/skills/task/SKILL.md`에 0단계(git status·log, HISTORY 파일 직접 확인, 중복 작업이면 보고) 추가, 기존 경로는 읽고 계획·ADR/Feature 번호는 현재 파일 목록 기준 규칙 추가. AI-LOG에 사례 기록.
- 영향: 스킬 정의·문서만.
- 검증: pre-commit(HISTORY·포맷·관련 테스트) 실행. 코드 변경 없어 verify 미실행. 스킬 동작은 다음 `/task` 실행에서 확인 필요.
- 주의/롤백: 이 세션의 중복 ADR 커밋은 push 전이라 reset으로 제거(이력 없음). revert로 롤백.

## 2026-10-26 | fix(ci): postgres 서비스 healthcheck 인자 제거
- Feature: N/A
- 목적: 첫 CI 실행(run 40294677023)이 서비스 컨테이너 생성 단계에서 실패해 이후 단계가 전혀 실행되지 않았다.
- 변경: `--health-cmd 'pg_isready -U keepio'` → `--health-cmd pg_isready`. runner가 따옴표 안 공백을 나눠 `-U`를 docker 옵션으로 해석(`unknown shorthand flag: 'U'`, exit 125).
- 영향: CI 설정만. healthcheck는 접속 수락 여부만 확인(인증 사용자 지정 불필요).
- 검증: 로컬에서 같은 옵션으로 postgres:16 컨테이너 실행해 `healthy` 도달 확인. GitHub Actions 재실행 결과는 push 후 확인(미실행).
- 주의/롤백: 로컬 CI 재현은 GitHub 서비스 컨테이너 단계를 흉내 내지 못한다. revert로 롤백.

## 2026-10-26 | chore(test): 실제 PostgreSQL 통합 테스트와 CI 활성화
- Feature: N/A
- 목적: Phase 0 "NestJS + PostgreSQL 프로젝트 구성"의 3단계. 백엔드 제약을 실제 DB로 검증하는 경로와, 로컬 hook을 우회해도 막히는 최종 게이트(CI)를 갖춘다.
- 변경: api `vitest.int.config.mts`(`*.int.test.ts`만, 파일 순차 실행)·`vitest.int.setup.ts`(`DATABASE_URL_TEST` 필수, DB 이름 `_test` 아니면 거부), `health.int.test.ts`(실제 DB /health 200, baseline 적용 확인). 루트 `test:integration`(turbo, 캐시 없음)·`db:migrate:test`(`PRISMA_TARGET=test`). turbo `globalPassThroughEnv`(DATABASE_URL·DATABASE_URL_TEST·DB_POOL_MAX·PRISMA_TARGET). `prisma.config.ts`는 URL이 없어도 generate 진행. `ci.example.yml` → `ci.yml`(main push·PR, 읽기 권한, 동시 실행 취소, 20분 제한, PR HISTORY 검사, npm ci → verify → db:migrate:test → test:integration → build). SETUP·README 반영.
- 영향: push 시 GitHub Actions 실행 시작(아직 push 안 함). 단위 테스트·verify는 DB 없이 동작.
- 검증: 로컬 `test:integration` 2 passed, 단위 3 passed(분리 확인). dev DB를 `DATABASE_URL_TEST`로 지정하면 setup이 거부. git 추적 파일만 복사한 깨끗한 폴더에서 CI 단계 재현 — `npm ci`·`verify`·`db:migrate:test`·`test:integration`(2 passed)·`build` PASS(Node 24.22.1, 로컬 PG 16 keepio_test). 재현 중 format 누락 3파일과 turbo 환경 변수 차단을 발견해 수정. 환경 변수 없이 verify PASS, migrate는 "Connection url is empty", 통합 테스트는 "DATABASE_URL_TEST is not set"으로 실패 확인. `check-history.py origin/main` OK. GitHub Actions 실제 실행은 미실행(push 전).
- 주의/롤백: CI의 postgres 서비스·Ubuntu 환경은 로컬 재현과 다를 수 있어 첫 실행 결과 확인 필요. 새 DB 환경 변수는 `globalPassThroughEnv`에 추가해야 turbo 작업에 전달된다. revert로 롤백(CI 비활성화).

## 2026-10-26 | chore(db): Prisma 7 + PostgreSQL 16 로컬 DB, /health DB 상태, 개발 환경 문서
- Feature: N/A
- 목적: Phase 0 "NestJS + PostgreSQL 프로젝트 구성"의 2단계. api가 실제 DB에 연결되고, 처음 보는 사람도 설치·실행할 수 있게 한다.
- 변경: `docker-compose.yml`(postgres:16, keepio·keepio_test DB). 로컬 포트를 다른 프로젝트와 겹치지 않는 7710번대로 통일 — web 7710(`--port`), api 7711(기본값·`.env`), DB 127.0.0.1:7712, 루트 `prisma/`(빈 baseline 마이그레이션)·`prisma.config.ts`, `.env.example`. api `PrismaModule`(adapter-pg, `DB_POOL_MAX` 상한, 연결 timeout 5초, 종료 시 `$disconnect`), `/health`가 `SELECT 1`(2초 timeout)로 DB 확인 — up 200 / down 503. main.ts가 루트 `.env`를 있을 때만 로드. 루트 `db:*`·`dev:api`(turbo 경유) 스크립트, turbo `//#db:generate`를 api build·dev·typecheck·test 앞에 실행. 생성 코드는 git·Prettier·ESLint 제외. `docs/SETUP.md`(설치·버전·명령·문제 해결), README·docs/README 링크, ADR-004에 Prisma 결정 추가.
- 영향: `/health` 응답에 `db` 필드 추가(계약 신규, 소비자 없음). api 실행에 DB와 `.env` 필요. 새 의존성 prisma·@prisma/client·@prisma/adapter-pg 7.10.1(11일 경과).
- 검증: `npm run verify` PASS(7/7, 생성 코드 삭제 상태에서 시작해 generate 자동 실행 확인), `npm run build` PASS(3/3), `npm audit` 0건. 단위 테스트 3개(up 200, down 503, OpenAPI) PASS. 실제 기동 — DB up 200 `{"status":"ok","db":"up"}`, 컨테이너 정지 시 503 `{"status":"error","db":"down"}`, 재시작 후 200 자동 복구, SIGTERM 정상 종료. `prisma migrate deploy` dev·test DB 모두 적용, `db:status` up to date. `npm run dev:api`를 생성 코드·dist 없는 상태에서 실행해 /health 200. 포트 변경 후 `db:up`(7712)·`db:status` up to date, `dev:api` 7711 /health 200, `dev:web` 7710 200, CORS `Access-Control-Allow-Origin: http://localhost:7710` 확인. Prisma 엔진 install script 보류 상태에서 generate·migrate 동작 확인. 실제 DB 통합 테스트(`*.int.test.ts`)는 미실행(다음 커밋).
- 주의/롤백: `docker compose down -v`는 로컬 데이터 삭제. baseline 마이그레이션은 `SELECT 1`만 실행. Prisma 8은 RC 단계라 보류. revert 후 `docker compose down`으로 롤백.

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
