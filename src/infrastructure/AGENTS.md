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

When MediaPipe is introduced:

- Load vision models through a dedicated adapter.
- Keep model paths configurable.
- Do not initialize models during server rendering.
- Do not send frames to external services.
- Declare browser compatibility assumptions.
- Expose normalized project-owned results.
- Handle loading, ready, failed, and disposed states.
- Release workers and resources when appropriate.
- Separate landmark extraction from gameplay interpretation.
- Do not couple MediaPipe confidence directly to narrative consequences.

MediaPipe is **not** installed yet.

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
