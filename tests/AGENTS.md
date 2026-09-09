# Tests Agent Instructions

These rules apply to files under `tests/`. Read the root [`AGENTS.md`](../AGENTS.md) and [`tests/README.md`](README.md) first. Local rules here add test-placement constraints; they do not replace global privacy, quality, or scope rules.

No test framework is installed yet. These rules prepare future test work.

## Purpose

`tests` will store tests that cross module boundaries or need shared test infrastructure.

Planned organization:

- `tests/unit`, `tests/integration`, `tests/e2e`;
- `tests/fixtures`, `tests/mocks`.

Do not create these subdirectories until real test files require them.

## Test Placement

- Prefer colocated tests for isolated feature behavior.
- Use global unit tests for cross-cutting pure modules.
- Place integration tests in `tests/integration`.
- Place complete user journeys in `tests/e2e`.
- Place shared deterministic input in `tests/fixtures`.
- Place shared boundary mocks in `tests/mocks`.
- Do not move a test away from its feature without a reason.

## Vision Testing Rules

When vision features are tested:

- Unit tests must not require a physical camera.
- Do not use live camera access in CI.
- Simulate camera permission states.
- Mock MediaPipe at the adapter boundary.
- Use deterministic timestamped sequences for blink rules.
- Test both eyes independently when relevant.
- Test low-confidence and missing-frame scenarios.
- Test prolonged closure separately from a blink.
- Test cleanup of streams and frame loops.
- Do not use real participant images as fixtures.
- Do not commit facial photographs for automated tests.
- Use synthetic or explicitly approved non-identifying fixtures when image fixtures become necessary.
- Document whether fixture data is synthetic.

## Test Quality

- Test observable behavior, not internal wiring.
- Use deterministic clocks when time affects behavior.
- Avoid arbitrary sleeps.
- Restore mocks after each test.
- Keep tests isolated.
- Name tests by expected behavior.
- Include negative and error cases.
- Do not reduce assertions merely to make a failing test pass.
- Do not mark tests as skipped without explaining why.

## E2E Preparation

- Use mocked detection events when testing general application journeys.
- Reserve browser camera simulation for dedicated compatibility tests.
- Do not rely on external services unless explicitly required.
- Keep E2E data isolated.
- Clean up created session data.
- Avoid exposing secrets in test logs or screenshots.

## Prohibited Patterns

- No production secrets in tests.
- No real facial data.
- No live camera dependency in automated unit tests.
- No network dependency in unit tests.
- No unstable timeout-based assertions.
- No snapshots used as a substitute for behavior checks.
- No skipped failing tests to satisfy validation.
- No tests added for functionality that does not exist.
