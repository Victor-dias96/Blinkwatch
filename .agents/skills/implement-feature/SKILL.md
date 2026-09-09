---
name: implement-feature
description: Implement or modify a Blinkwatch application feature while respecting feature boundaries, privacy requirements, issue scope, TypeScript conventions, and repository validation. Use when adding user-facing behavior, hooks, services, schemas, domain rules, or feature-specific UI.
metadata:
  version: '1.0.0'
  project: 'blinkwatch'
---

# Implement Feature

## Purpose

Deliver a complete, scoped Blinkwatch feature change: new behavior, modified behavior, or integration between existing modules—without violating architecture, privacy, or issue boundaries.

## Use this skill when

- The issue requests a new feature or behavior change.
- You are adding or changing feature-specific components, hooks, services, schemas, or domain rules.
- You are wiring existing modules together within defined boundaries.

## Do not use this skill when

- The task is project setup or configuration only.
- The task is documentation-only (`update-documentation`).
- The task is review-only with no implementation (`review-code`).
- The task is test-only (`write-tests`).
- The change is infrastructure-only with no feature behavior.
- The fix is a small, isolated change with no functional impact.
- Requirements are unclear—clarify or plan first.

## Required context

Before implementing, read:

1. The complete issue prompt and acceptance criteria.
2. Root [`AGENTS.md`](../../../AGENTS.md).
3. The nearest contextual `AGENTS.md` (for example `src/features/AGENTS.md`, `src/app/AGENTS.md`).
4. Existing code in the target feature or area.
5. [`docs/architecture/project-structure.md`](../../../docs/architecture/project-structure.md) when placement is uncertain.
6. [`package.json`](../../../package.json) to confirm available dependencies and scripts.

## Precedence

Apply rules in this order (higher overrides lower only when explicitly required by the issue, never for privacy or security):

1. Explicit issue requirements.
2. Applicable repository safety and privacy rules.
3. Nearest contextual `AGENTS.md`.
4. Root `AGENTS.md`.
5. This skill procedure.
6. Existing repository conventions.

If an issue requirement conflicts with privacy or security, **stop**, report the conflict, and do not implement the unsafe requirement.

## Inputs

The task should provide:

- What behavior to add or change.
- Acceptance criteria.
- Affected areas (routes, features, domain, infrastructure).
- Any privacy or camera constraints specific to the change.

## Procedure

1. Read the complete issue prompt.
2. Read root `AGENTS.md` and applicable contextual `AGENTS.md` files.
3. Inspect existing code in the target area; identify conventions and boundaries.
4. Identify client/server boundaries and Server vs Client Component needs.
5. Define inputs, outputs, and error states.
6. Verify privacy requirements for any camera or vision work.
7. Draft a short implementation plan (files to create or change, dependency direction).
8. Implement the **smallest complete change** that meets acceptance criteria.
9. Keep complex logic out of React components; use hooks, services, or domain modules.
10. Place external integrations (MediaPipe, database, realtime) behind infrastructure adapters.
11. Add or update tests when test infrastructure exists and the issue expects them.
12. Update documentation when behavior or setup changes.
13. Review the diff; remove unrelated changes.
14. Run validation commands (see Validation).
15. Produce a factual final report per root `AGENTS.md`.

## Project constraints

- Do not create an empty feature directory.
- Do not create all possible feature subdirectories automatically.
- Do not move code to `shared` without genuine cross-feature reuse.
- Do not place MediaPipe initialization directly in React components.
- Do not place gameplay rules inside infrastructure adapters.
- Do not transmit camera frames to the server.
- Do not persist facial landmarks unless an approved future requirement explicitly allows it.
- Do not implement identity recognition.
- Distinguish browser detection events from gameplay consequences.
- Clean up streams, animation frames, workers, timers, and listeners when no longer needed.
- Preserve Server and Client Component boundaries; add `"use client"` only when required.
- Do not install dependencies not approved by the current issue (MediaPipe, Socket.IO, Prisma, test frameworks, etc. are **not** installed unless the issue authorizes them).
- Follow dependency direction: `app → features, shared`; `features → domain, infrastructure, shared`; `infrastructure → domain`; `server → domain, infrastructure, shared`; `domain` has no framework imports.

## Model strategy

- Routine, well-scoped tasks can proceed with the available agent (for example Composer).
- Investigations and fixes with clear context may use capable agents (for example Grok).
- **Claude is currently unavailable.** Do not declare it available.
- Pause when a task truly requires stronger reasoning (advanced computer vision, calibration tuning, complex concurrency) that the current agent cannot reliably guarantee.
- Explain why a pause is needed; continue only after the owner confirms stronger model access is restored.

## Validation

Run from the repository root:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Fix with `npm run format` and `npm run lint:fix` when needed. Run tests when they exist and the issue requires them.

## Stop conditions

Stop and report before continuing when:

- The issue requires transmitting or storing raw images, video, or facial data without an approved privacy decision.
- The issue suggests facial identity recognition.
- Acceptance criteria are contradictory.
- A required dependency is not installed and the issue does not authorize installation.
- A significant unplanned architectural change is required.
- Advanced computer vision, calibration, or concurrency work exceeds what the available agent can reliably deliver.
- Claude is truly required and remains unavailable.

## Output

Provide a factual report including:

- Summary of what was implemented.
- Files created and modified.
- Privacy and boundary decisions taken.
- Commands run and validation results.
- Remaining limitations and out-of-scope findings.
- Suggested Conventional Commits message if appropriate.

Do not declare functionality implemented unless it exists in the repository.
