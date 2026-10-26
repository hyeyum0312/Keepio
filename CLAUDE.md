# Claude Entry Point

Read `AGENTS.md` first; it is the canonical cross-agent instruction. Do not duplicate rules here.

For a task, read only the relevant files under `docs/standards/` and the affected product specification. Before editing, report scope, affected files, data/API contracts, regression risks, and test plan. For broad changes, wait for approval.

Use repository scripts rather than guessing commands. Do not claim tests/build passed unless actually executed. Keep responses concise; summarize findings instead of pasting large files. Update docs/QA evidence and decisions only when the task changes behavior or architecture.

## Feature / History
새 기능은 `docs/features/FEATURE-TEMPLATE.md` 기준으로 먼저 명세한다. 매 커밋 전에 `docs/HISTORY.md`를 최신순으로 갱신하고 `docs/standards/HISTORY.md`의 주의사항을 지킨다. 전체 History를 자동으로 읽지 않는다.
