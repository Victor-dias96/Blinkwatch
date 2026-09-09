# Features Agent Instructions

These rules apply to files under `src/features/`. Read the root [`AGENTS.md`](../../AGENTS.md) first. Local rules here add feature-module constraints; they do not replace global privacy, quality, or scope rules.

## Purpose

`src/features` will contain vertical functional modules such as:

- `camera`, `face-tracking`, `blink-detection`, `calibration`;
- `gameplay`, `creatures`, `rooms`, `realtime`, `session-history`.

These modules are **planned**. Create a feature directory only when an issue requires real implementation.

## Feature Boundaries

- Each feature owns its feature-specific UI and logic.
- Do not import private internals from another feature.
- Expose a small public API only when cross-feature usage becomes necessary.
- Do not create barrel files automatically.
- Do not force identical internal structures on every feature.
- Create only directories required by current functionality.
- Move logic to `shared` only after genuine cross-feature reuse.
- Keep external SDK adapters in `infrastructure` when appropriate.
- Keep framework-independent rules separate from React components.

## Suggested Internal Structure

A feature may contain, as needed:

- `components`, `hooks`, `services`, `schemas`, `types`, `utils`;
- colocated tests.

None of these subdirectories are mandatory for every feature.

## Vision-Related Rules

When vision features are implemented:

- Process camera frames locally in the browser by default.
- Do not transmit or persist raw frames.
- Do not implement identity recognition or infer participant identity.
- Keep MediaPipe-specific access behind an infrastructure adapter.
- Keep mathematical detection rules independently testable.
- Avoid placing the entire processing loop inside a React component.
- Clean up animation frames, timers, workers, and media resources.
- Document thresholds and confidence assumptions.
- Prefer explicit state machines for temporal detection logic.
- Distinguish detection failure from gameplay failure.
- Do not classify a blink from a single unstable frame.
- Account for calibration and confidence before emitting gameplay events.

These rules prepare future work. MediaPipe and detection are **not** implemented yet.

## Feature Tests

- Colocate tests when they verify a single feature module.
- Test pure rules without React whenever possible.
- Mock browser or SDK boundaries instead of reproducing third-party behavior.
- Do not use real camera access in unit tests.
- Use deterministic samples for temporal rules.
- Avoid fragile tests based only on implementation details.

## Prohibited Patterns

- No empty features or speculative abstractions.
- No feature importing private files from another feature.
- No raw MediaPipe landmarks leaking through the entire application.
- No UI component controlling all domain and infrastructure behavior.
- No persistence of facial data without an approved requirement.
- No dependency addition for future features.
