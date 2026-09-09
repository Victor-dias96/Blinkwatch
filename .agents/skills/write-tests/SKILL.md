---
name: write-tests
description: Create or update deterministic Blinkwatch unit, integration, or end-to-end tests. Use when verifying application behavior, temporal blink rules, browser permission states, feature boundaries, error handling, or regression fixes.
metadata:
  version: '1.0.0'
  project: 'blinkwatch'
---

# Write Tests

## Purpose

Add or maintain automated tests that verify observable Blinkwatch behavior with deterministic, reproducible assertions—without requiring physical hardware or real facial data in CI.

## Use this skill when

- The issue requests new or updated tests.
- You need to lock in behavior for domain rules, hooks, components, or integrations.
- You are fixing a regression and must prove the fix with a failing-then-passing test.

## Do not use this skill when

- The task is feature implementation without a test requirement (`implement-feature`).
- The task is documentation-only (`update-documentation`).
- The task is review-only (`review-code`).
- No test runner is installed and the issue does not authorize installing one—**stop and report** instead of simulating results.

## Required context

Before writing tests, read:

1. The complete issue prompt.
2. Root [`AGENTS.md`](../../../AGENTS.md).
3. Nearest contextual `AGENTS.md` (especially [`tests/AGENTS.md`](../../../tests/AGENTS.md) when present).
4. The module under test and its public boundaries.
5. [`tests/README.md`](../../../tests/README.md) for placement conventions.
6. [`package.json`](../../../package.json) to verify whether a test framework is installed.

**This skill does not authorize installing test tools on your own.** The issue must define when test infrastructure should be introduced. If no compatible runner exists, stop and report the absence—do not fabricate pass/fail results.

## Precedence

1. Explicit issue requirements.
2. Applicable repository safety and privacy rules.
3. Nearest contextual `AGENTS.md`.
4. Root `AGENTS.md`.
5. This skill procedure.
6. Existing repository conventions.

## Inputs

The task should provide:

- Behavior to verify (expected inputs, outputs, errors).
- Test level (unit, component, integration, e2e) if specified.
- Whether test framework installation is in scope.

## Test level selection

| Level             | Use for                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| **Unit**          | Pure rules, domain logic, isolated modules without UI or I/O                |
| **Component**     | UI behavior, rendering, user interactions                                   |
| **Integration**   | Communication between modules (feature + infrastructure adapter with mocks) |
| **E2E**           | Complete user journeys across routes and features                           |
| **Compatibility** | Real browser or camera behavior only when the issue explicitly requires it  |

## Procedure

1. Identify the observable behavior under test.
2. Choose the appropriate test level.
3. Locate existing tests for the same area; follow their patterns.
4. Verify test infrastructure in `package.json` (Vitest, Testing Library, Playwright, etc.).
5. Map positive cases (happy path).
6. Map negative cases (invalid input, denied permissions, missing data).
7. Map error states and edge transitions.
8. Control time and randomness—no flaky timing.
9. Create deterministic test data and fixtures.
10. Isolate browser SDKs and APIs at boundaries (mock MediaPipe at infrastructure, not internals).
11. Write the test(s).
12. Run the created test(s) with the project's test command when available.
13. Run related validation (`npm run typecheck`, `npm run lint` as applicable).
14. Confirm the test fails when the behavior breaks (when feasible).
15. Report actual execution results—never invent them.

## Computer vision test rules

- Do not require a physical camera in automated tests.
- Simulate camera permission states (`granted`, `denied`, `prompt`).
- Mock MediaPipe at the infrastructure boundary; do not reproduce MediaPipe internals.
- Use deterministic sequences of timestamps and eye open/closed states.
- Test missing frames and low-confidence results.
- Test one-eye and two-eye scenarios when relevant.
- Distinguish a blink from prolonged eye closure.
- Test cooldown and duplicate event suppression when applicable.
- Verify cleanup of streams and processing loops.
- Do not commit identifiable facial photographs.
- Use synthetic fixtures when image data is necessary; mark them clearly as synthetic.
- Avoid arbitrary `sleep`; use fake or controlled clocks for temporal behavior.

## Project constraints

- Place tests per [`tests/README.md`](../../../tests/README.md): colocated with features, beside domain files, or under `tests/integration/`, `tests/e2e/`, `tests/fixtures/`, `tests/mocks/` as appropriate.
- Do not install Vitest, Testing Library, Playwright, or other frameworks unless the issue authorizes it.
- Do not assume MediaPipe or test tools are already installed—they are planned, not present by default.

## Model strategy

- Most test authoring is routine and can proceed with the available agent.
- Pause when test design requires deep vision-algorithm reasoning beyond the current agent's reliable capability.
- **Claude is currently unavailable.** Pause and explain if truly required.

## Validation

When a test runner exists, execute the new or updated tests and report real output.

Always run applicable project checks touched by test files:

```bash
npm run typecheck
npm run lint
```

Run full validation when test infrastructure or config changed:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## Stop conditions

Stop and report when:

- The required test tool is not installed and the issue does not authorize installation.
- The only viable test would require real facial data or identifiable photos.
- The test would depend on a physical camera in CI.
- Expected behavior is undefined or contradictory.
- The test requires unauthorized external network access.
- Results cannot be reproduced deterministically.

## Output

Provide a factual report including:

- Behavior covered and test level chosen.
- Files created or modified.
- Test commands run and actual results.
- Gaps (untested areas, missing infrastructure).
- Suggested Conventional Commits message if appropriate.
