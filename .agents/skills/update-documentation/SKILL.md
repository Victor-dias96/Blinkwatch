---
name: update-documentation
description: Create or update Blinkwatch technical documentation so it accurately reflects repository behavior, architecture, privacy, setup, commands, and decisions. Use when code changes require documentation or when an issue specifically requests documentation.
metadata:
  version: '1.0.0'
  project: 'blinkwatch'
---

# Update Documentation

## Purpose

Produce or revise technical documentation that accurately describes what the repository **does today**, how to work with it, and why decisions were made—without duplicating other sources of truth or claiming unimplemented behavior.

## Use this skill when

- An issue explicitly requests documentation changes.
- Code changes alter behavior, setup, commands, architecture, or privacy characteristics and docs must stay in sync.
- You need to record an architecture decision (ADR) for a meaningful choice.

## Do not use this skill when

- The task is feature implementation (`implement-feature`).
- The task is test authoring (`write-tests`).
- The task is code review without doc updates (`review-code`).
- Behavior is undefined—implement or clarify first.

## Required context

Before editing documentation, read:

1. The complete issue prompt.
2. Root [`AGENTS.md`](../../../AGENTS.md).
3. Nearest contextual `AGENTS.md` when documenting a specific area.
4. The **real implementation** the docs must describe (source code, config, scripts).
5. Existing docs at the target path and nearby related docs.
6. [`package.json`](../../../package.json) for actual npm scripts and dependencies.
7. [`README.md`](../../../README.md) and [`docs/architecture/project-structure.md`](../../../docs/architecture/project-structure.md) to avoid duplication.

## Precedence

1. Explicit issue requirements.
2. Applicable repository safety and privacy rules.
3. Nearest contextual `AGENTS.md`.
4. Root `AGENTS.md`.
5. This skill procedure.
6. Existing repository conventions.

## Inputs

The task should provide:

- Documentation audience (contributors, agents, operators).
- Topics to add or update.
- Whether the change reflects implemented behavior or planned work.

## Procedure

1. Identify the target audience.
2. Inspect the real implementation; do not trust outdated docs alone.
3. Inspect existing documentation at and near the target location.
4. Choose the smallest correct documentation location (README, `docs/`, contextual `AGENTS.md`, ADR).
5. Clearly separate **current behavior** from **planned behavior**.
6. Use relative links for repository documents.
7. Document only commands that exist in `package.json` or config.
8. Document privacy implications when camera, vision, or data handling is involved.
9. Avoid duplicating content already owned by another file—link instead.
10. Verify paths, filenames, and command examples against the repository.
11. Format Markdown consistently; let Prettier apply on commit when applicable.
12. Review the final diff for accuracy and scope.

## Project constraints

- Never document planned behavior as implemented.
- Never claim camera data stays local unless the code confirms it.
- Never claim a validation command passed without executing it.
- Use exact repository paths in examples.
- Do not copy the entire roadmap into implementation documentation.
- Use Architecture Decision Records in `docs/decisions/` only for meaningful decisions.
- Keep setup instructions concise.
- Do not include secrets, real credentials, room codes, access tokens, or personal information.
- Keep examples clearly fictional.
- Update nearby documentation rather than creating competing sources of truth.
- Agent Skills live in `.agents/skills/`; reference [`AGENTS.md`](../../../AGENTS.md) for permanent agent rules—do not duplicate full skill bodies in docs.

## Model strategy

- Documentation tasks are usually routine; proceed with the available agent.
- Pause if technical accuracy requires deep verification of vision or privacy behavior you cannot confirm from code.
- **Claude is currently unavailable.**

## Validation

```bash
npm run format:check
npm run lint
```

Manually verify links, paths, and command names. Run `npm run typecheck` and `npm run build` only if documentation changes affect code or config.

## Stop conditions

Stop and report when:

- Documentation and code diverge in ways that cannot be resolved within issue scope.
- A privacy claim cannot be verified against implementation.
- Behavior is not yet defined.
- The issue asks to document nonexistent functionality as complete.
- There is risk of exposing sensitive data.

## Output

Provide a factual report including:

- Documents created or modified and why.
- Audience and scope of each change.
- Verified vs planned statements.
- Commands run.
- Suggested Conventional Commits message if appropriate.
