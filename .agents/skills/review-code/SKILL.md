---
name: review-code
description: Review Blinkwatch code changes for correctness, scope, architecture, privacy, security, accessibility, performance, and validation evidence. Use when reviewing a diff, pull request, completed issue, regression fix, or agent-generated implementation.
metadata:
  version: '1.0.0'
  project: 'blinkwatch'
---

# Review Code

## Purpose

Produce an evidence-based code review that identifies problems by severity, verifies Blinkwatch-specific privacy and architecture rules, and reports validation evidence—**without automatically modifying code** unless the task also requests implementation.

## Use this skill when

- Reviewing a diff, pull request, or branch changes.
- Verifying completion of an issue or agent-generated implementation.
- Investigating a regression.
- Performing a pre-merge check.

## Do not use this skill when

- The task is to implement fixes or features (`implement-feature`).
- The task is to author tests (`write-tests`).
- The task is documentation-only (`update-documentation`).

## Required context

Before reviewing, obtain and read:

1. The diff or changed files (full context when possible).
2. Issue acceptance criteria or PR description.
3. Root [`AGENTS.md`](../../../AGENTS.md).
4. Applicable contextual `AGENTS.md` for touched areas.
5. Validation output or CI results when claimed.
6. [`docs/architecture/project-structure.md`](../../../docs/architecture/project-structure.md) for boundary questions.

## Precedence

1. Explicit review requirements from the issue or PR.
2. Privacy and security rules (never weakened by lower layers).
3. Nearest contextual `AGENTS.md`.
4. Root `AGENTS.md`.
5. This skill procedure.

## Inputs

The task should provide:

- Diff, PR link, or list of commits to review.
- Acceptance criteria or intended behavior.
- Validation evidence when available.

## Review order

Examine changes in this priority:

1. Privacy and camera safety
2. Security
3. Correctness
4. Acceptance criteria
5. Regressions
6. Architecture boundaries
7. Server and client boundaries
8. Resource cleanup
9. Tests and validation evidence
10. Accessibility
11. Performance
12. Maintainability
13. Style and naming

## Blinkwatch checklist

Verify when relevant to the diff:

- Raw camera frames are not transmitted.
- Video is not recorded.
- Facial landmarks are not persisted.
- Identity recognition is absent.
- Camera permission is explicit in UX when camera is used.
- Media tracks are released on unmount or stop.
- Animation frames and timers are canceled.
- Browser APIs are not accessed during server rendering.
- MediaPipe is isolated behind infrastructure boundaries.
- Unstable frames do not directly emit gameplay events.
- Calibration and confidence are considered before gameplay events.
- Duplicate events are suppressed when required.
- Reconnect behavior does not duplicate events when realtime exists.
- Client-submitted data is treated as untrusted on the server.
- Route and API input is validated.
- No secrets appear in client bundles.
- Accessibility semantics remain intact.
- Validation claims are backed by evidence.

## Finding severity

| Severity     | Criteria                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Critical** | Privacy breach, secret exposure, destructive behavior, or severe security flaw                                    |
| **High**     | Incorrect core behavior, data loss risk, missing authorization, major regression                                  |
| **Medium**   | Architecture violation, unreliable detection, missing cleanup, important untested behavior, accessibility failure |
| **Low**      | Maintainability, naming, small duplication, non-blocking improvement                                              |

Avoid inflated severity. Each finding must include:

- Severity
- File and location
- Observed problem
- Impact
- Evidence (code reference, behavior, missing check)
- Recommended correction

## Model strategy

- Most reviews can proceed with the available agent.
- Mark the review incomplete or pause when advanced vision, calibration, or concurrency analysis exceeds reliable capability.
- **Claude is currently unavailable.** Do not declare it available.

## Procedure

1. Obtain the full diff or changed file set.
2. Read acceptance criteria and issue scope.
3. Read applicable `AGENTS.md` files.
4. Walk the review order above; record findings with evidence.
5. Check validation claims against logs or CI output when provided.
6. Note assumptions, missing context, and unverified areas.
7. Write the review in the Output format below.
8. Do **not** apply fixes unless the task explicitly requests implementation.

## Stop conditions

Stop or mark the review incomplete when:

- The diff is unavailable.
- Essential files are missing from context.
- Validation is claimed without evidence.
- Privacy claims conflict with the actual data flow.
- Analysis requires reasoning the available agent cannot reliably provide.
- Claude is required and remains unavailable.

## Output

Start with **findings ordered by severity** (Critical → High → Medium → Low). If none, state clearly that no issues were found.

Then include:

- **Assumptions** — what you inferred.
- **Questions or missing context** — what would clarify the review.
- **Validation reviewed** — commands or CI checks observed.
- **Residual risks** — areas not fully verified.
- **Conclusion** — concise merge/readiness recommendation.

When no problems are found, still document what was reviewed, which validations were observed, and which areas could not be verified.

Do not modify code as part of this skill unless the same task also authorizes implementation.
