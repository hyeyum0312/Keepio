# Performance / Cost / Operations

- Establish budgets after measurement; initially record p50/p95 API latency, request count per flow, AI tokens/cost per classification, worker queue age, DB pool utilization, memory RSS/heap, error rate.
- Avoid unconditional client polling, repeated metadata fetches and duplicate AI classification. Deduplicate jobs by stable identity and state; bound retries and timeout.
- Every cache proposal: problem metric, key, TTL, invalidation, max size, staleness tolerance, cost tradeoff and failure fallback. Default is no custom cache.
- Memory leaks: inspect growing heap/RSS under repeated navigation, queue batches, timers/listeners, open DB connections, stream cleanup; test bounded concurrency and backpressure.
- Logging/observability: request ID and job ID; structured logs with PII redaction; alerts on failed jobs, queue backlog, memory growth and error spikes. No performance claim without baseline and repeatable measurement.
- Any proposal must state side effects: data migrations, API compatibility, security, UX, infrastructure cost, rollback, and tests.
- Dependencies: exact versions; adopt releases at least ~14 days old (Dependabot `cooldown`, `.github/dependabot.yml`). Major upgrades get their own task and ADR when they change tooling behavior.
