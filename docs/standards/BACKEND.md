# Backend Rules (Node.js / NestJS)

- Modular monolith; feature modules `auth`, `bookmarks`, `categories`, `tags`, `buckets`, `classifications`, `publications`, `usage`. Controller handles transport, service domain rules, repository persistence; no unnecessary generic repository abstraction.
- DTO/schema validated at boundary; OpenAPI is contract (after changing controllers/DTOs run `npm run openapi:generate` and commit `packages/api-client`); explicit response models hide private fields. Tenant ownership verified on every read/write; public publication endpoint has separate DTO.
- PostgreSQL constraints and transactions enforce invariants; bookmark-category N:M; per-user normalized URL uniqueness for active records; duplicate concurrent save returns existing ID. Soft-delete restore and unique-index conflict need documented semantics.
- Publication versions immutable; publishing atomically changes published version pointer. Editing draft never changes public content until publish.
- External URLs: scheme allowlist, DNS/IP filtering including redirects and rebinding defenses, timeout, byte limit, content-type validation, safe parsing. Never fetch arbitrary local/private resources.
- Queue: use outbox when durable event delivery is required; at-least-once delivery assumed; idempotent handlers, bounded retries/backoff, DLQ/failed-job visibility. No infinite retry or unbounded parallelism.
- Query efficiency: index by observed access patterns, cursor pagination, avoid N+1, bounded result sizes. Measure before caching. DB pool and worker concurrency have explicit limits.
- Quotas: enforce atomically under concurrency, distinguish active bookmark count vs metered AI usage. No in-memory counter as authority.
- Security: use maintained auth solution; token rotation, secure storage, authorization tests, secret management, rate limits. Do not log tokens, URLs containing sensitive query data, or AI payloads without redaction.
- Errors: throw `ApiException(status, code, message)`; every error body is `{ code, message, requestId, details? }` (ADR-006). Clients branch on `code`, never on `message`. Document error responses with `ApiErrorResponse` in OpenAPI.
- Config: read environment only through `loadEnv()` (`apps/api/src/config/env.ts`); add new variables there with validation, to `.env.example`, and to turbo `globalPassThroughEnv` if tests need them.
