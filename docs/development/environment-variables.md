# Environment variables

## Purpose

Blinkwatch validates environment configuration with [Zod](https://zod.dev/) at module load time. Typed modules replace direct application access to `process.env`, separate public values from server-only secrets, and produce clear errors when a defined variable is invalid.

The project currently requires **no external credentials** and no custom `.env.local` file for local development or production builds.

## Client and server separation

| Module | Path                              | Allowed variables                                       | Consumed by                                       |
| ------ | --------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Client | `src/shared/config/env/client.ts` | `NEXT_PUBLIC_*` only                                    | Client Components, shared browser-safe code       |
| Server | `src/shared/config/env/server.ts` | Server-only keys (no `NEXT_PUBLIC_` prefix for secrets) | Server Components, route handlers, server modules |

The client module references each public variable explicitly (for example, `process.env.NEXT_PUBLIC_EXAMPLE`). It must **not** parse or export the full `process.env` object.

The server module validates private configuration. Do **not** import it from Client Components.

## Location of typed modules

```
src/shared/config/env/
├── client.ts   → export: clientEnv
└── server.ts   → export: serverEnv
```

Import these objects instead of reading `process.env` directly in application code.

## Rules for `NEXT_PUBLIC_`

- Only variables prefixed with `NEXT_PUBLIC_` may be used deliberately in browser code.
- The prefix means the value is **not secret** and will be exposed to clients.
- Public values are inlined during `next build`. Changing them after a production build may not update an existing client bundle.
- Secrets, API keys, tokens, and private URLs must **never** use the `NEXT_PUBLIC_` prefix.

## Creating `.env.local`

1. Copy [`.env.example`](../../.env.example) to `.env.local` at the repository root.
2. Add only variables required by the feature you are implementing.
3. Never commit `.env.local` (it is ignored by Git).

Next.js loads `.env.local` automatically in development and build.

## Relationship with `.env.example`

- `.env.example` is versioned and contains **no real credentials**.
- Update `.env.example` whenever a new real variable is introduced.
- Do not add placeholder variables for future work.
- Mandatory variables should be added only together with the functionality that uses them.

## Validation errors

Validation runs when the corresponding module is imported.

On failure:

- The process throws with a message such as `Invalid server environment configuration: NODE_ENV`.
- Only **variable names** are included in the message.
- Received values are never logged or printed.

Fix the named variables in `.env.local` or the deployment environment, then restart the dev server or rebuild.

## Adding a new server variable

1. Introduce the variable together with the feature that consumes it.
2. Add the key to the schema in `src/shared/config/env/server.ts`.
3. Map it explicitly from `process.env.YOUR_VARIABLE` in `safeParse`.
4. Document it in `.env.example` with a clearly fictional example if a sample value helps.
5. Import `serverEnv` (or a module that loads it) from server-only code.

Example shape:

```typescript
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  MY_SERVICE_URL: z.string().url(),
});

const result = serverEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  MY_SERVICE_URL: process.env.MY_SERVICE_URL,
});
```

## Adding a new public variable

1. Confirm the value is safe to expose in the browser.
2. Name it with the `NEXT_PUBLIC_` prefix.
3. Add it to `src/shared/config/env/client.ts` and reference `process.env.NEXT_PUBLIC_*` explicitly.
4. Document it in `.env.example`.
5. Import `clientEnv` from Client Components or other browser code.

## Prohibited values

Do not introduce environment flags that weaken privacy or security, including:

- Uploading or storing raw camera frames
- Enabling facial recognition or biometric identity
- Recording video by configuration
- Persisting face landmarks via env toggles

If a task requests such configuration, stop and request a privacy and architecture review.

Also prohibited in `.env.example` and schemas unless a real feature exists:

- `DATABASE_URL`
- `AUTH_SECRET`
- Realtime server URLs
- MCP tokens
- MediaPipe or vision model paths without an implemented integration

## Privacy rules

Environment configuration must not override Blinkwatch privacy constraints:

- Camera processing stays local in the browser by default.
- Raw images, video, and facial data must not be transmitted or stored via configuration.
- Never log environment values in application code.

## Deployment considerations

- Set server-only variables in the hosting provider's secret or environment configuration.
- Set public variables at **build time** when they must appear in the client bundle.
- Keep `.env.local` out of version control; use platform secrets for production.
- The build should fail clearly when a required variable is missing or invalid.

## Troubleshooting

| Symptom                                                     | Likely cause                                           | Action                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Build fails with `Invalid server environment configuration` | Invalid or missing validated server variable           | Check variable names in the error; fix deployment or `.env.local` |
| Public variable undefined in browser                        | Missing `NEXT_PUBLIC_` prefix or not set at build time | Rename with prefix; rebuild                                       |
| Secret exposed in client bundle                             | Secret used `NEXT_PUBLIC_` prefix                      | Move to server module; remove public prefix                       |
| `.env.local` changes ignored for public vars                | Client bundle already built                            | Restart dev server or run a new production build                  |
| Accidental client import of server env                      | Client Component imported `server.ts`                  | Move import to a Server Component or server module                |

## Server-only enforcement note

The `server-only` npm package is not installed in this repository. Preventing accidental client imports relies on:

- architectural boundaries documented in `AGENTS.md`;
- code review;
- keeping `server.ts` imports out of files marked with `"use client"`.

If stronger compile-time enforcement becomes necessary, a future issue may add the `server-only` package explicitly.
