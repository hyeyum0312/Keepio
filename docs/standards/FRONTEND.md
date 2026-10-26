# Frontend Rules

## Stack (apps/web)

- Installed: Next.js 16.2.9 (App Router only), React 19.2.4, TypeScript strict, Tailwind CSS v4, ESLint 9, Vitest 4 + Testing Library (jsdom). Candidates, confirm before installing: TanStack Query, Zustand (only for state shared across screens), shadcn/ui + Radix, Orval.
- Next.js 16 may differ from training data: read the relevant guide in `node_modules/next/dist/docs/` before writing framework code.
- Server components by default; add `"use client"` only for interaction/state. Tests are colocated as `*.test.ts(x)`.

## Structure (ADR-002)

```
apps/web/src/
├── app/                 routing/layout only; composes features, no logic
├── features/<domain>/   bookmarks, categories, buckets, publications …
│   ├── ui/ model/ api/ lib/   create only what is needed
│   └── index.ts         the only import surface for other features
└── shared/{ui,lib,api,config}   moved here only on the second real consumer
```

## Boundaries

- Enforced by ESLint (`apps/web/eslint.config.mjs`): no `@/features/<x>/<internal>` imports, no `../../` escaping a feature, `shared` must not import `features`, file/folder naming.

- Feature-first: `features/bookmarks/{ui,model,api,lib}`; `shared/ui`, `shared/lib` for proven cross-feature code. `ui` renders props, `model` owns UI state/domain orchestration, `api` owns transport. Keep public exports explicit.
- Server is source of truth for category membership, classification status, quotas, ordering, permissions, publish status and totals. Do not guess or reconstruct from incomplete pages. Client derives presentation-only state (selection count, expanded/collapsed, input validity).
- Typed API client generated or checked against OpenAPI. Normalize error and pagination handling; no duplicate fetch wrappers per component.

## Network / state

- Each query has documented key, owner, stale policy, invalidation triggers, loading/error states. Prefer request deduplication via query library; no polling unless product requirement and interval documented.
- Mutations invalidate only affected keys; no speculative refetch storms. Avoid optimistic updates for destructive/complex relationships without rollback plan.
- Avoid effect-driven fetch loops; stable dependency arrays; abort in-flight requests on unmount/navigation; clean up listeners/timers/observers. Never retain large API payloads in redundant global stores.
- Memoization/caching only after measured rerender/network/CPU bottleneck; document baseline, TTL/invalidation, memory ceiling and rollback. React framework defaults are not a license for arbitrary caches.
- Rendering: stable keys, virtualize large lists only when needed, paginate from server, image size/lazy loading, avoid re-creating heavy editors on every keystroke.

## Styling

- Follow `DESIGN.md`; reuse tokens and library variants. No inline arbitrary colors. Class ordering enforced by formatter/plugin if installed.
- Separate view from logic: API/schema change should normally touch `api/model` and tests, not every `ui` component. Prefer adapters/selectors at boundary.
