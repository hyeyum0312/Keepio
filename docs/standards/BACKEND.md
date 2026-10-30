# Backend Rules (Node.js / NestJS)

## Structure (apps/api)

```
apps/api/src/
├── main.ts setup-app.ts app.module.ts   bootstrap; app.module only imports modules
├── <domain>/                one Nest module per domain (list: spec 03 "모듈"), e.g. bookmarks/
│   ├── <domain>.module.ts
│   ├── <domain>.controller.ts   transport: validated DTO in, response model out
│   ├── <domain>.service.ts      domain rules and transaction boundary
│   ├── <domain>.repository.ts   Prisma queries for this domain
│   ├── dto/                     request DTOs (class-validator), response models (@nestjs/swagger)
│   └── lib/                     pure domain functions (e.g. URL normalization), unit-tested
├── common/                  cross-module HTTP concerns (errors, request context)
├── config/                  environment (loadEnv)
├── prisma/                  PrismaService / PrismaModule
└── generated/               Prisma client output; never edit
```

- Create only the files a module needs. Files are `<domain>.<role>.ts` (kebab-case, lint); DTO files `dto/<action>-<domain>.dto.ts`, response models `dto/<domain>-response.dto.ts`. Relative imports end in `.js` (ESM).
- Services do not inject `PrismaService`; they call the module's repository. No generic base repository. How a service-level transaction reaches repositories is decided in FEAT-001 and written here.
- Another module uses a domain only through the providers its module `exports`, never its repository, `dto/` or `lib/` files directly. Lint enforcement is added with the second domain module.
- Controllers get the current user from one guard + decorator, never from body or query. Until auth (D-04), a dev/test-only guard supplies it and rejects in production (D-11); the auth feature replaces the guard without changing controllers.

## Migrations and tests

- Schema `prisma/schema.prisma` (repo root), migrations `prisma/migrations/`. Commands and test DB setup: `docs/SETUP.md`.
- Constraints Prisma cannot express (partial unique index, check constraints) go as SQL in the same migration: create with `--create-only`, add the SQL, then apply. Never edit a migration that has been applied anywhere.
- Prisma Migrate has no down migrations. A migration PR states its rollback steps and data impact in HISTORY "주의/롤백"; the exact form is decided in FEAT-001 and written here.
- Unit `*.test.ts` next to the source; DB integration `*.int.test.ts` against the `_test` database, files run sequentially on one shared DB. Test layering and naming: `QUALITY.md`.

## Rules

- Modular monolith; modules follow spec 03. Controller handles transport, service domain rules, repository persistence; no unnecessary generic repository abstraction.
- DTO/schema validated at boundary; OpenAPI is contract (after changing controllers/DTOs run `npm run openapi:generate` and commit `packages/api-client`); explicit response models hide private fields. Tenant ownership verified on every read/write; public publication endpoint has separate DTO.
- PostgreSQL constraints and transactions enforce invariants; bookmark-category N:M; per-user normalized URL uniqueness for active records; duplicate concurrent save returns existing ID. Soft-delete restore and unique-index conflict need documented semantics.
- Publication versions immutable; publishing atomically changes published version pointer. Editing draft never changes public content until publish.
- External URLs: scheme allowlist, DNS/IP filtering including redirects and rebinding defenses, timeout, byte limit, content-type validation, safe parsing. Never fetch arbitrary local/private resources.
- Queue: use outbox when durable event delivery is required; at-least-once delivery assumed; idempotent handlers, bounded retries/backoff, DLQ/failed-job visibility. No infinite retry or unbounded parallelism.
- Query efficiency: index by observed access patterns, cursor pagination, avoid N+1, bounded result sizes. Measure before caching. DB pool and worker concurrency have explicit limits.
- Quotas: enforce atomically under concurrency, distinguish active bookmark count vs metered AI usage. No in-memory counter as authority.
- Security: use maintained auth solution; token rotation, secure storage, authorization tests, secret management, rate limits. Do not log tokens, URLs containing sensitive query data, or AI payloads without redaction.
- Errors: throw `ApiException(status, code, message)`; every error body is `{ code, message, requestId, details? }` (ADR-006). `message` is the Korean sentence the client shows as-is; `code` is for branching behavior only; `details` is developer-only (ADR-009). Errors a user can act on (e.g. invalid URL) get their own `code` and message instead of `VALIDATION_FAILED`. Use the wording approved in the Feature doc's error table. Never pass framework/internal messages through. Document error responses with `ApiErrorResponse` in OpenAPI.
- Config: read environment only through `loadEnv()` (`apps/api/src/config/env.ts`); add new variables there with validation, to `.env.example`, and to turbo `globalPassThroughEnv` if tests need them.
