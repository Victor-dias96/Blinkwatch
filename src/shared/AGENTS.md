# Shared Agent Instructions

These rules apply to files under `src/shared/`. Read the root [`AGENTS.md`](../../AGENTS.md) first. Local rules here add shared-code constraints; they do not replace global privacy, quality, or scope rules.

## Purpose

`src/shared` contains code reused by more than one feature or by different application areas.

Future subdirectories may include:

- `components`, `hooks`, `lib`, `schemas`, `types`, `utils`.

Create subdirectories only when real shared files are added.

## Shared Eligibility

Before adding code to `shared`, ask:

1. Is this used by more than one feature?
2. Is it independent from a specific feature?
3. Does moving it here improve ownership?
4. Can it remain near its original use until reuse actually exists?

If reuse is not justified, keep the code in the responsible feature.

## shadcn/ui Rules

- Generated shadcn/ui components belong in `src/shared/components/ui`.
- Preserve generated component behavior unless an issue requires customization.
- Do not install components that are not needed by the current issue.
- Use the configured `cn` utility from `@/shared/lib/utils`.
- Keep primitive components generic.
- Do not embed Blinkwatch gameplay rules in shared UI primitives.
- Maintain accessibility behavior inherited from component primitives.
- Do not replace Lucide with additional icon libraries without justification.

## Shared Library Rules

- `shared/lib` — small reusable library setup and helpers.
- `shared/utils` — pure generic functions.
- `shared/types` — truly cross-feature types.
- `shared/schemas` — validation shared across boundaries.
- `shared/hooks` — hooks with more than one real consumer.

Shared code must not import private feature internals or depend on server-only modules unless clearly server-specific and relocated appropriately.

## Prohibited Patterns

- No feature-specific rules in shared.
- No catch-all utilities or dumping-ground types files.
- No premature generic components.
- No business rules inside shadcn primitives.
- No imports from a feature into shared.
- No browser-only behavior hidden in modules used by Server Components.
