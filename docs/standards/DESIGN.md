# Design System / UX Rules

1. Start from API response shape and actual states, not placeholder visuals. Any UI-only derivation must be documented.
2. Prefer existing accessible component library (candidate: shadcn/ui + Radix); extend through wrappers/variants. Avoid editing vendor primitives or copying components repeatedly.
3. Token source of truth: CSS variables for semantic tokens, mapped into Tailwind theme utilities. Search tokens and existing variants before adding colors. Never mix `#hex`, `rgb()`, `hsl()`, Tailwind palette utilities and semantic tokens for the same role. No ad-hoc inline colors, arbitrary spacing/radius or magic z-index without documented exception.
4. Semantic tokens: `background`, `foreground`, `surface`, `muted`, `border`, `primary`, `primary-foreground`, `destructive`, `success`, `warning`, `focus-ring` (define light/dark states if supported). Token names describe role, not a particular hue.
5. New token requires usage rationale, accessibility contrast check, impact search, and design-system update. ESLint blocks hex/rgb/hsl/oklch literals and Tailwind arbitrary colors (`bg-[#fff]`) in `src/**/*.{ts,tsx}`. Not covered: Tailwind palette utilities (`text-red-500`), spacing/radius/z-index, CSS files — manual review still required.
6. Component contract: variants, size, loading/empty/error/disabled, keyboard focus, screen reader labels, mobile touch target, responsive behavior.
7. Screens: library (all/unclassified/classified), categories N:M, bucket, template, editor, public page. AI recommendation must be distinguishable from applied state.
8. Publication preview and published page must share rendering primitives; editor state must not leak into public renderer.
9. Change visual tokens/components only if requested or required by acceptance criteria; do not redesign UI for domain-logic changes.

## Keepio token status

Defined in `apps/web/src/app/globals.css` (`:root` CSS variables → `@theme inline`). The CSS variables are the only source.

| Token                                                                                                            | Status                                                                             |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `background`, `foreground`                                                                                       | defined                                                                            |
| `surface`, `muted`, `border`, `primary`, `primary-foreground`, `destructive`, `success`, `warning`, `focus-ring` | not defined yet                                                                    |
| `ai` (#7f77dd)                                                                                                   | exists from the earlier plan ("only AI features use purple"); keep or drop is D-09 |

Do not add colors until D-09 decides tone and values.
