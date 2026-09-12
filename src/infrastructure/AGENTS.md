# Infrastructure Agent Instructions

These rules apply to files under `src/infrastructure/`. Read the root [`AGENTS.md`](../../AGENTS.md) first. Local rules here add integration and adapter constraints; they do not replace global privacy, quality, or scope rules.

## Purpose

`src/infrastructure` will contain external integrations and adapters such as:

- MediaPipe adapters;
- database clients and concrete repositories;
- realtime clients;
- persistence and observability adapters;
- external API integrations.

Create infrastructure modules only when an issue requires real implementation.

## Dependency Boundaries

- Infrastructure may depend on external SDKs.
- Infrastructure may implement contracts defined by central domain rules.
- Framework-independent logic must not depend on infrastructure.
- React components must not directly instantiate complex SDK clients.
- Keep vendor-specific types at adapter boundaries.
- Map external results into project-owned types.
- Do not propagate third-party objects throughout the application.
- Isolate initialization and cleanup.
- Make failure states explicit.
- Avoid hidden mutable singletons unless technically justified.

## MediaPipe Preparation

`@mediapipe/tasks-vision` is installed. Face Landmarker **loading** lives in `src/infrastructure/mediapipe`. Frame processing, landmark interpretation, and blink detection are **not** implemented.

- Load vision models only through the dedicated adapter. Features must not import `FilesetResolver`, `FaceLandmarker`, or other SDK types.
- Keep model and WASM paths in `face-landmarker-config.ts`.
- Initialize only in the browser after an explicit user action. Do not initialize during SSR, module import, or the first render.
- Import the SDK dynamically inside `initialize()`. Never import it from a Server Component.
- Process vision locally in the browser. Do not send frames, images, or facial data to external services.
- Expose Blinkwatch-owned loading states (`idle`, `loading`, `ready`, `failed`, `disposed`). Do not leak SDK objects.
- Dispose with the official `close()` method. Dispose is idempotent. A disposed instance must not be reused; `initialize()` after `dispose()` creates a new task.
- Do not call `detect`, `detectForVideo`, or any inference API until a future issue requires frame processing.
- Do not couple MediaPipe confidence to narrative consequences.

## Database Preparation

When persistence is introduced:

- Do not access the database from Client Components.
- Do not store camera frames, screenshots, or video.
- Do not store facial landmarks by default.
- Avoid storing biometric-like data.
- Persist gameplay events only when a future issue explicitly requires it.
- Use migrations when persistence is introduced.
- Never embed credentials in source code.

No database infrastructure exists yet.

## Realtime Preparation

When realtime is introduced:

- Transmit event contracts, not video.
- Validate inbound and outbound events.
- Use stable identifiers for deduplication.
- Treat clients as untrusted.
- Do not allow transport-specific objects to become domain types.
- Handle reconnection and duplicate delivery explicitly.

Realtime is **not** implemented yet.

## Prohibited Patterns

- No direct SDK usage scattered across components.
- No credentials committed to the repository.
- No facial recognition service.
- No remote image processing without approved architecture.
- No unvalidated external data.
- No dependency installation outside current scope.
- No infrastructure code created only for hypothetical future use.
