# Server Agent Instructions

These rules apply to files under `src/server/`. Read the root [`AGENTS.md`](../../AGENTS.md) first. Local rules here add server-only constraints; they do not replace global privacy, quality, or scope rules.

## Purpose

`src/server` will contain server-exclusive code such as:

- authentication and authorization;
- server-side validation;
- protected configuration access;
- orchestration of server operations;
- administrative session operations;
- server-only services.

Create server modules only when an issue requires real implementation.

## Server Boundary

- Server modules must never be imported by client modules.
- Protect server-only modules using the appropriate framework mechanism when introduced.
- Do not expose environment variables to the browser unless explicitly public.
- Validate all untrusted input.
- Verify authorization for protected operations.
- Return minimal data in responses.
- Avoid exposing implementation details in errors.
- Do not log secrets.
- Do not log raw facial or camera data.
- Do not treat room codes as authorization by themselves when authentication is introduced.

## Privacy

- The server must not request raw camera streams.
- The server must not store video frames.
- The server must not reconstruct participant faces.
- The server may receive gameplay events only when realtime functionality is implemented.
- Received event payloads must be minimized and validated.
- Privacy statements must reflect the real data flow.

## Prohibited Patterns

- No server secrets in client-exposed files.
- No direct database access from client code.
- No authorization based only on UI state.
- No raw error objects returned to users.
- No server module imported into a Client Component.
- No placeholder authentication implementation.
- No mock security represented as production-ready protection.

## Validation Notes

When changing server code, verify:

- server and client import boundaries;
- input validation on all untrusted data;
- authorization behavior when applicable;
- absence of leaked environment variables;
- production build success;
- global validation requirements from the root instructions.
