# keepio — Node.js 백엔드 아키텍처 v0.3

## 목적

백엔드 이직 포트폴리오를 고려하여 데이터 무결성, 동시성, 비동기 처리, 장애 복구, 인증/인가, 테스트 역량을 드러내는 구조로 설계한다. 기술을 과도하게 늘리지 않는다.

## 추천 스택

| 영역             | 기술                                                        |
| ---------------- | ----------------------------------------------------------- |
| Runtime/Language | Node.js LTS / TypeScript                                    |
| API              | NestJS, REST, OpenAPI                                       |
| DB/ORM           | PostgreSQL / Prisma                                         |
| Queue            | Redis + BullMQ (비동기 작업 단계에서 도입)                  |
| 인증             | NestJS 인증 모듈, JWT + 안전한 Refresh Token 회전 (ADR-011) |
| Validation       | DTO + class-validator                                       |
| 테스트           | Vitest(+SWC), Supertest, DB 통합 테스트                     |
| 인프라           | Docker, GitHub Actions, 관리형 DB/스토리지                  |
| 웹/모바일        | Next.js / Expo + React Native WebView                       |

## 시스템 구조

```text
Expo Native Shell ─┐
Next.js Web UI ────┼──> NestJS REST API ──> PostgreSQL (Prisma)
Public Web Page ───┘           │
                               └──> Outbox Dispatcher ──> BullMQ/Redis
                                                              │
                                                         NestJS Worker
                                                              │
                                                  Metadata Fetch / AI API
```

**Modular Monolith + Worker**: 하나의 코드베이스 안에서 도메인 모듈을 분리하고 API와 Worker를 별도 프로세스로 실행. 초기부터 마이크로서비스로 분리하지 않음.

## 모듈

- Auth: 인증, 토큰 회전, 로그아웃, 권한 검사
- Bookmark: URL 정규화, 중복 방지, 저장, Soft Delete, 복구
- Category/Tag: N:M 관계, 별칭, 이름 충돌, 병합
- Bucket: 링크 연결/제거, 정렬
- Classification: AI 요청·검증·적용, 재시도 상태
- Template/Publication: 초안, 블록, 스냅샷, 버전, 공개 조회
- Usage: 리소스별 제한, 기간별 사용량
- Jobs: Outbox, 작업 큐, 실패/재시도 추적

## 데이터 흐름: 링크 저장

1. JWT 검증 및 사용자 식별.
2. URL 파싱·정규화·안전성 검사.
3. PostgreSQL 트랜잭션에서 북마크 생성 또는 기존 항목 조회; 신규라면 Outbox 이벤트 기록.
4. API는 저장 결과를 빠르게 반환.
5. Dispatcher가 Outbox를 BullMQ로 전달.
6. Worker가 메타데이터를 안전하게 수집하고 AI 분류 후 DB 업데이트.
7. 재시도 중복에 대비해 이벤트 ID/작업 상태로 멱등성 보장.

## 핵심 기술 과제

1. **동시 저장**: 활성 `(user_id, normalized_url)` 유니크 인덱스, 충돌 처리. 100개 동시 요청에도 북마크 1개.
2. **삭제 무결성**: N:M 연결, Soft Delete/복구, 발행물 스냅샷의 독립성 검증.
3. **비동기 신뢰성**: Transactional Outbox, 재시도·백오프·실패 추적·멱등 Worker.
4. **발행 버전**: 불변 버전 생성, 공개 버전 포인터 원자적 교체, 기존 slug 유지.
5. **사용량/보안**: 동시 요청에서 한도 초과 방지, 사용자 소유권 검사, 외부 URL SSRF 방어.

## 인증 및 보안

- 로그인 수단: 이메일/비밀번호, 소셜(Google·Kakao, Apple은 iOS 출시 시), 패스키(로그인한 계정에 추가 등록). 수단과 무관하게 세션 발급은 Auth 모듈 하나가 맡는다(ADR-011).
- 소셜 로그인: 서버가 처리하는 Authorization Code + PKCE + OIDC(state·nonce·ID 토큰 검증). 제공자가 인증한 이메일만 기존 계정과 자동 연결하고, 인증 안 된 기존 계정과 연결할 때는 그 계정의 비밀번호·세션을 무효화한다. 모바일 앱은 WebView가 아닌 시스템 브라우저로 진행한다(FEAT-004).
- 비밀번호는 argon2id 해시로 저장. 이메일 인증·비밀번호 재설정 토큰은 1회용이며 해시로 저장.
- Access Token: JWT 15분, 서명만 검증(요청당 DB 조회 없음). 웹은 메모리에 보관. 로그아웃 후에도 만료까지 유효한 점은 수용하고, 민감한 API에는 사용자별 세션 버전 검사를 추가한다.
- Refresh Token: 무작위 값을 해시로 저장, `HttpOnly; Secure; SameSite=Lax` 쿠키, 14일 절대 만료, 사용할 때마다 회전. 유예 시간 이후 재사용되면 같은 로그인의 토큰 묶음 전체를 폐기한다. 만료 행은 하루 1회 정리.
- 쿠키 전송을 위해 웹과 API는 같은 사이트로 배포한다(Next.js 프록시 또는 같은 상위 도메인). 모바일 앱 토큰 저장소는 Phase 0 PoC 후 결정.
- 로그인·가입·메일 발송은 IP·이메일별 요청 제한. 응답과 응답 시간으로 가입 여부를 노출하지 않는다.
- WebView ↔ 네이티브 인증 브리지 및 OS별 저장소 동작을 PoC로 검증.
- 객체 스토리지 접근 정책, 공개/비공개 파일 구분.
- 외부 URL은 사설·루프백·링크로컬 주소, DNS 재바인딩, 리다이렉트, 응답 크기·타임아웃 제한 처리.
- 공개 페이지에 개인정보/비공개 메타데이터가 유출되지 않도록 별도 응답 모델 사용.

## 폴더 구조

`(예정)`은 아직 없는 폴더다. 해당 단계에서 만든다. `apps/api` 내부 구조는 `docs/standards/BACKEND.md`.

```text
keepio/
  apps/
    api/         # NestJS REST
    worker/      # (예정) NestJS BullMQ worker — 비동기 작업 단계
    web/         # Next.js
    mobile/      # (예정) Expo — 모바일 구현 단계
  packages/
    shared/      # (예정) 타입/계약 — 필요해질 때 (ADR-002)
    api-client/  # OpenAPI → Orval 생성 클라이언트
  prisma/
  docs/
    decisions/   # ADR
```

## 단계적 도입

초기에는 DB·API·인증·URL 공유 PoC를 먼저 완성. AI 분류 도입 시 Queue/Worker 추가. 운영 부담이 커지면 별도 배포/확장하며, 초기에는 불필요한 캐시·마이크로서비스를 만들지 않는다.
