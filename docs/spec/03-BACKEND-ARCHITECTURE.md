# keepio — Node.js 백엔드 아키텍처 v0.3

## 목적

백엔드 이직 포트폴리오를 고려하여 데이터 무결성, 동시성, 비동기 처리, 장애 복구, 인증/인가, 테스트 역량을 드러내는 구조로 설계한다. 기술을 과도하게 늘리지 않는다.

## 추천 스택

| 영역             | 기술                                              |
| ---------------- | ------------------------------------------------- |
| Runtime/Language | Node.js LTS / TypeScript                          |
| API              | NestJS, REST, OpenAPI                             |
| DB/ORM           | PostgreSQL / Prisma                               |
| Queue            | Redis + BullMQ (비동기 작업 단계에서 도입)        |
| 인증             | NestJS 인증 모듈, JWT + 안전한 Refresh Token 회전 |
| Validation       | DTO + class-validator                             |
| 테스트           | Vitest(+SWC), Supertest, DB 통합 테스트           |
| 인프라           | Docker, GitHub Actions, 관리형 DB/스토리지        |
| 웹/모바일        | Next.js / Expo + React Native WebView             |

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

- 비밀번호 저장 시 검증된 해시 알고리즘/라이브러리 사용.
- Refresh Token은 안전하게 보관·회전·폐기하고 탈취 재사용 대응 정책 정의.
- WebView ↔ 네이티브 인증 브리지 및 OS별 저장소 동작을 PoC로 검증.
- 객체 스토리지 접근 정책, 공개/비공개 파일 구분.
- 외부 URL은 사설·루프백·링크로컬 주소, DNS 재바인딩, 리다이렉트, 응답 크기·타임아웃 제한 처리.
- 공개 페이지에 개인정보/비공개 메타데이터가 유출되지 않도록 별도 응답 모델 사용.

## 폴더 구조

```text
keepio/
  apps/
    api/         # NestJS REST
    worker/      # NestJS BullMQ worker
    web/         # Next.js
    mobile/      # Expo
  packages/
    shared/      # 타입/계약
    api-client/
  prisma/
  docs/
    decisions/   # ADR
```

## 단계적 도입

초기에는 DB·API·인증·URL 공유 PoC를 먼저 완성. AI 분류 도입 시 Queue/Worker 추가. 운영 부담이 커지면 별도 배포/확장하며, 초기에는 불필요한 캐시·마이크로서비스를 만들지 않는다.
