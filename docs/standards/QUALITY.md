# QA / Regression / Test Policy

## Test pyramid
- Unit: pure domain rules (URL normalization, classification mapping, quota rules, publication state machine).
- Integration: real PostgreSQL/test DB for unique constraints, transactions, ownership, soft delete, snapshot consistency; mocked external AI/metadata.
- Contract: OpenAPI/schema compatibility, API error shape, nullable fields, pagination; frontend client must compile against contract.
- E2E: critical user journeys on web; mobile share-intent/WebView auth on iOS and Android real devices or simulator as available.
- Accessibility/visual: keyboard, focus, contrast; screenshot diffs for core screens after UI changes.

## Regression gates
- `npm run verify` (format:check → lint → typecheck → test) is the single local done-gate for humans, AI agents and CI. Do not report a task done without running it.
- Each bug fix adds a failing regression test first when practical.
- Each PR/AI task states impacted modules and risk-based test selection; no blanket claim that targeted tests replace full suite.
- Commit local fast gate: format/lint staged files, related unit tests, typecheck when practical. Push/PR CI: lint, typecheck, unit, integration, production builds; scheduled/release E2E/mobile smoke if too slow for every push.
- If a test is flaky, quarantine with owner/issue/expiry, do not silently skip. Snapshot updates require intentional visual review.
- No external services or secrets in ordinary unit tests. Test DB must be isolated and disposable.

## Test case format
`ID | requirement | preconditions | steps | expected API/DB/UI | negative/edge | automated test path | status | evidence`

## Must-cover scenarios
1. 100 concurrent same-URL saves -> 1 active bookmark and same ID.
2. Multiple categories/buckets per bookmark; ownership checks; category/bucket deletion preserves bookmark.
3. Soft delete/recovery, deleted URL resave policy, publish snapshot survives source deletion.
4. AI timeout/invalid JSON/duplicate delivery -> save unaffected, retries bounded, no duplicate category.
5. Draft edit does not alter published page; republish retains slug and creates version; unpublish blocks access.
6. Quota simultaneous requests; cross-user access denial; malicious URL/redirect SSRF rejection.
7. Frontend list fetch count, mutation invalidation, route cleanup, offline/error/empty, keyboard accessibility.

## Evidence
Write concise actual commands, environment, pass/fail, failures, and known gaps to `docs/qa/TEST-REPORT.md`. Do not fabricate metrics or coverage.
