# 개발 환경 설정 (백엔드 중심)

처음 클론한 Mac에서 api를 띄우기까지 필요한 것과, 매일 쓰는 명령어를 정리한다. 명령어는 모두 **저장소 루트**에서 실행한다.

## 1. 구성 한눈에 보기

```text
브라우저/앱 ──HTTP──> apps/api (NestJS, :7711) ──Prisma──> PostgreSQL (Docker 컨테이너, :7712)
```

| 이름                  | 역할                                                                          |
| --------------------- | ----------------------------------------------------------------------------- |
| **Node.js**           | JavaScript/TypeScript 실행기. web과 api 모두 이 위에서 돈다                   |
| **nvm**               | Node 버전 관리자. 프로젝트마다 다른 Node 버전을 쓸 수 있게 해 준다            |
| **NestJS**            | API 서버 프레임워크. `apps/api`                                               |
| **PostgreSQL**        | 데이터베이스. 내 Mac에 직접 설치하지 않고 Docker 컨테이너로 띄운다            |
| **Docker (OrbStack)** | 컨테이너 실행기. OrbStack은 Mac용 Docker 실행 앱(Docker Desktop 대체, 가벼움) |
| **Prisma**            | DB 스키마 정의·마이그레이션·타입이 있는 DB 클라이언트                         |

## 2. 버전

버전이 어디에 고정돼 있는지도 함께 적는다. 올릴 때는 그 파일을 바꾼다.

| 도구                | 버전                 | 고정 위치                                    |
| ------------------- | -------------------- | -------------------------------------------- |
| Node.js             | **24.22.1** (24 LTS) | `.nvmrc`, `package.json`의 `engines`         |
| npm                 | 11.x (Node에 포함)   | -                                            |
| PostgreSQL          | 16                   | `docker-compose.yml`, CI 예시                |
| NestJS              | 12.2.0               | `apps/api/package.json`                      |
| Prisma              | 7.10.1               | 루트 `package.json`(CLI), `apps/api`(client) |
| TypeScript / Vitest | 5.9 / 4.1            | `package-lock.json`                          |
| Next.js             | 16.4.3               | `apps/web/package.json`                      |

- Node 24.22.1 미만이면 `npm install`이 `EBADENGINE`으로 **일부러 실패**한다(`.npmrc`의 `engine-strict`). 2026-10-21 Node 보안 릴리스(CVE-2026-111497) 대응이다.
- 새 의존성은 배포 후 7일 이상 지난 버전을 고른다(공급망 공격 대비). 보안 수정은 예외.
- 도구 선택 이유: [ADR-004](decisions/ADR-004-api-toolchain.md)

## 3. 처음 한 번만: 설치

### 3-1. Homebrew

macOS 패키지 관리자. 없으면 [brew.sh](https://brew.sh)의 설치 명령을 실행한다. 확인: `brew --version`

### 3-2. nvm + Node

```bash
brew install nvm                      # 이미 ~/.nvm이 있으면 생략
nvm install 24.22.1
nvm alias default 24.22.1             # 새 터미널의 기본 버전
node -v                               # v24.22.1
```

다른 프로젝트가 다른 버전을 쓰면 그 폴더에서 `nvm use <버전>`. 이 저장소에서는 `nvm use`만 치면 `.nvmrc`를 읽는다.

선택: 폴더에 들어가면 자동 전환 — `~/.zshrc`에 추가

```bash
autoload -U add-zsh-hook
load-nvmrc() { [ -f .nvmrc ] && nvm use --silent; }
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### 3-3. OrbStack (Docker)

```bash
brew install --cask orbstack
open -a OrbStack                      # 최초 1회 실행해 초기 설정
docker --version                      # 확인
```

### 3-4. 저장소 준비

```bash
nvm use
npm install                           # 의존성 설치 + git hook 연결
cp .env.example .env                  # 로컬 환경 변수. .env는 커밋되지 않는다
npm run db:up                         # PostgreSQL 컨테이너 시작
npm run db:deploy                     # 마이그레이션 적용
npm run dev:api                       # api 실행 (Prisma client 생성 포함)
```

다른 터미널에서 확인:

```bash
curl localhost:7711/health            # {"status":"ok","db":"up"}
open http://localhost:7711/docs       # API 문서(OpenAPI)
```

`npm install` 때 `install-scripts ... not yet covered by allowScripts` 경고가 나온다. npm이 패키지 설치 스크립트를 기본으로 보류하는 정책이고, 현재 보류된 것(prisma, @swc/core, @scarf/scarf 등) 없이도 정상 동작함을 확인했다. **승인(`npm install-scripts approve`)하지 않는다.**

## 4. 매일 쓰는 명령어

| 하고 싶은 것                         | 명령어                                                  |
| ------------------------------------ | ------------------------------------------------------- |
| DB 켜기 / 끄기                       | `npm run db:up` / `npm run db:down` (데이터는 유지)     |
| api 개발 서버 (코드 수정 시 재시작)  | `npm run dev:api` → 종료는 `Ctrl+C`                     |
| web 개발 서버                        | `npm run dev:web`                                       |
| 완료 판정 (포맷·린트·타입·테스트)    | `npm run verify`                                        |
| 빌드                                 | `npm run build`                                         |
| api 테스트만                         | `npm run test --workspace=@keepio/api`                  |
| 통합 테스트 (실제 DB, `keepio_test`) | `npm run db:migrate:test` → `npm run test:integration`  |
| 마이그레이션 상태                    | `npm run db:status`                                     |
| DB 직접 들여다보기 (psql)            | `docker compose exec postgres psql -U keepio -d keepio` |

## 5. DB 스키마를 바꿀 때

1. `prisma/schema.prisma`에 모델을 추가·수정한다.
2. `npm run db:migrate -- --name <변경-이름>` → `prisma/migrations/`에 SQL이 생기고 로컬 DB에 적용된다.
3. 생성된 `migration.sql`을 읽어 본다(특히 컬럼 삭제·이름 변경은 데이터 손실 위험).
4. 마이그레이션 폴더를 코드와 함께 커밋한다. 이미 커밋된 마이그레이션은 수정하지 않고 새로 만든다.

규칙: [standards/BACKEND.md](standards/BACKEND.md), 테이블 설계: [spec/04](spec/04-DATABASE-API.md)

## 6. 환경 변수 (`.env`)

| 변수                | 의미                                | 로컬 기본값                 |
| ------------------- | ----------------------------------- | --------------------------- |
| `DATABASE_URL`      | 개발 DB 주소                        | `...@localhost:7712/keepio` |
| `DATABASE_URL_TEST` | 통합 테스트 DB 주소(개발 DB와 분리) | `.../keepio_test`           |
| `DB_POOL_MAX`       | DB 커넥션 수 상한                   | `10`                        |
| `PORT`              | api 포트                            | `7711`                      |
| `WEB_ORIGIN`        | CORS 허용 web 주소(없으면 CORS 끔)  | `http://localhost:7710`     |

`.env.example`의 비밀번호는 로컬 컨테이너 전용이다. 실제 비밀값은 `.env`에도 커밋하지 않고, 운영은 배포 환경의 환경 변수로 넣는다.

## 7. 포트

회사 등 다른 프로젝트가 흔히 쓰는 3000번대·5432와 겹치지 않도록 keepio는 **7710번대**를 쓴다. 새 서비스(worker 등)도 7713부터 이어서 쓴다.

| 포트 | 무엇                | 비고                                         |
| ---- | ------------------- | -------------------------------------------- |
| 7710 | web (Next.js)       | `apps/web` dev/start 스크립트의 `--port`     |
| 7711 | api (NestJS)        | `PORT`로 변경                                |
| 7712 | PostgreSQL (Docker) | `docker-compose.yml`. 컨테이너 안에서는 5432 |

## 8. 테스트와 CI

| 종류        | 파일            | 대상 DB                                            | 실행                                              |
| ----------- | --------------- | -------------------------------------------------- | ------------------------------------------------- |
| 단위 테스트 | `*.test.ts`     | 없음(DB는 가짜로 대체)                             | `npm run verify`에 포함, 커밋 시 관련 테스트 자동 |
| 통합 테스트 | `*.int.test.ts` | `DATABASE_URL_TEST` (이름이 `_test`로 끝나야 실행) | `npm run test:integration`                        |

- 통합 테스트 전에 테스트 DB에 마이그레이션을 적용한다: `npm run db:migrate:test`.
- GitHub에 push하거나 PR을 열면 `.github/workflows/ci.yml`이 깨끗한 환경에서 `npm ci → verify → db:migrate:test → test:integration → build`를 실행한다. PR이면 HISTORY 보존 검사도 한다. CI가 최종 기준이다.
- turbo는 선언하지 않은 환경 변수를 작업에 넘기지 않는다. DB 관련 새 환경 변수를 만들면 `turbo.json`의 `globalPassThroughEnv`에도 추가한다.

## 9. 문제 해결

| 증상                                                  | 원인 / 해결                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm install`이 `EBADENGINE`                          | Node 버전이 낮다 → `nvm use` (없으면 `nvm install`)                                          |
| `/health`가 503 `{"db":"down"}`                       | DB 컨테이너가 꺼짐 → `npm run db:up`. OrbStack 앱이 실행 중인지 확인                         |
| `Cannot find module …/generated/prisma/client.js`     | Prisma client 미생성 → `npm run db:generate` (turbo로 실행하는 명령은 자동 생성)             |
| `DATABASE_URL is not set` / `Connection url is empty` | `.env`가 없다 → `cp .env.example .env`                                                       |
| `EADDRINUSE :7711`                                    | api가 이미 떠 있다 → 기존 터미널에서 `Ctrl+C`, 또는 `lsof -nP -iTCP:7711`로 확인             |
| 로컬 DB를 완전히 초기화하고 싶다                      | `docker compose down -v` → `npm run db:up` → `npm run db:deploy` (**로컬 데이터 전부 삭제**) |
