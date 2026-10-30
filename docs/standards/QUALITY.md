# QA / Regression / Test Policy

## Test pyramid

- Unit: pure domain rules (URL normalization, classification mapping, quota rules, publication state machine).
- Integration: real PostgreSQL/test DB for unique constraints, transactions, ownership, soft delete, snapshot consistency; mocked external AI/metadata.
- Contract: OpenAPI/schema compatibility, API error shape, nullable fields, pagination; frontend client must compile against contract.
- E2E: critical user journeys on web; mobile share-intent/WebView auth on iOS and Android real devices or simulator as available.
- Accessibility/visual: keyboard, focus, contrast; screenshot diffs for core screens after UI changes.

## Regression gates

- `npm run verify` (format:check → lint → typecheck → test) is the single local done-gate for humans, AI agents and CI. Do not report a task done without running it.
- Automatic local gates: Claude Code PostToolUse hook (Prettier + ESLint on the edited file), git pre-commit (`check-history.py` + Prettier on staged files), git commit-msg (no AI attribution). All are bypassable; CI is the final gate.
- Each bug fix adds a failing regression test first when practical.
- Each PR/AI task states impacted modules and risk-based test selection; no blanket claim that targeted tests replace full suite.
- Commit local fast gate: format/lint staged files, related unit tests, typecheck when practical. Push/PR CI: lint, typecheck, unit, integration, production builds; scheduled/release E2E/mobile smoke if too slow for every push.
- If a test is flaky, quarantine with owner/issue/expiry, do not silently skip. Snapshot updates require intentional visual review.
- No external services or secrets in ordinary unit tests. Test DB must be isolated and disposable.

## When to run tests

Run cheap checks often, expensive ones once. Never claim a pass without running it.

| When                             | What                                                     | How                                                         |
| -------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| Every file edit                  | format + lint of that file                               | Claude Code PostToolUse hook (automatic)                    |
| Before an AI reports a step done | tests related to changed files, **once**                 | `npm run test:related -w @keepio/web -- <files>` (api 동일) |
| Every commit                     | HISTORY check, Prettier + related tests for staged files | `.githooks/pre-commit` (automatic)                          |
| Task done (`/finish`)            | format, lint, typecheck, all unit tests, **once**        | `npm run verify`                                            |
| PR (dev·stg·prod)                | verify + DB integration + build, changed packages only   | CI (`scripts/ci-scope.sh`; weekly/manual = full)            |

- Do not run tests after every edit: mid-change states fail by design and the noise costs tokens and focus.
- If related tests in pre-commit exceed ~30s, move them to pre-push and record the change in HISTORY.

## Token economy

- Gates are silent on success; on failure they print only the tail (pre-commit: last 40 lines, verify: failing tasks only via `--output-logs=errors-only`, tests: dot reporter).
- Do not re-run a passing gate without a code change. Read failure output, fix, re-run the narrowest command.
- No Stop/turn-end test hook: an extra AI turn per failure costs more than it saves at this size. Revisit if false "done" reports appear (log them in `docs/qa/AI-LOG.md`).

## Writing tests

- Location: unit `*.test.ts(x)` next to the source; DB integration `*.int.test.ts`; web E2E `apps/web/e2e/`.
- By layer: `lib`/`model` pure logic → unit, required. `api` → response/error shape against the contract. `ui` → Testing Library by role and behavior; no snapshots by default. Backend constraints (unique, transaction, ownership) → real PostgreSQL integration.
- Name tests as behavior sentences in Korean, prefixed with the Feature AC when one exists: `it("AC-01: 같은 URL을 다시 저장하면 기존 ID를 반환한다")`.
- One behavior per test, arrange → act → assert. Mock only external boundaries (network, AI, clock, randomness); never mock own modules to make a test pass.
- Bug fix: write the failing test first.
- Concurrency tests must force the race, not hope for it: hold every request at the point before the contended write (barrier on the repository call) and assert all of them reached the write. Then remove the protection (e.g. `ON CONFLICT`) once and confirm the test fails every time. Example: FEAT-001 AC-03.
- Enforced by ESLint (`src/**/*.test.ts(x)`): no `.only`, no `.skip` (use `.todo`), no test without `expect`, no duplicate titles.
- Review-only: no `sleep`-based waits (use fake timers / `findBy*`), no unreviewed snapshot updates, no weakened assertions.
- Coverage: no percentage target yet. Decide after measuring a few features; do not invent a number.

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
