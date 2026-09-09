# App Router Agent Instructions

These rules apply to files under `src/app/`. Read the root [`AGENTS.md`](../../AGENTS.md) first. Local rules here add App Router–specific constraints; they do not replace global privacy, quality, or scope rules.

## Purpose

`src/app` contains:

- routes and route segments;
- layouts and templates;
- pages and loading states;
- error boundaries;
- route handlers;
- metadata;
- composition of features and shared UI.

Keep route files focused on routing and composition, not business logic.

## Route Responsibilities

Routes must:

- stay small and readable;
- coordinate features and shared components;
- define metadata when required;
- default to Server Components;
- use Client Components only when necessary;
- delegate complex logic to features or appropriate modules;
- validate route parameters when applicable;
- maintain explicit separation between client and server code.

## Server and Client Components

- Do not add `"use client"` to layouts or pages without a concrete requirement.
- Use `"use client"` only for state, effects, browser APIs, or event handlers.
- Keep the client boundary as small as practical.
- Do not import server-only modules into Client Components.
- Do not pass non-serializable values from Server Components to Client Components.
- Access camera APIs only from client-side modules.
- Do not access `navigator`, `window`, or `MediaDevices` during server rendering.

## Route Handlers

Route handlers must:

- validate all untrusted input;
- use appropriate HTTP methods and status codes;
- delegate persistence and infrastructure work to server or infrastructure modules;
- not expose stack traces or secrets in responses.

Route handlers must not:

- contain facial processing logic;
- receive raw camera images by default;
- be created without a real requirement.

## Prohibited Patterns

- No MediaPipe initialization directly in route files.
- No blink calculations in pages or layouts.
- No database queries directly in visual components.
- No large business rules in route handlers.
- No browser API access in Server Components.
- No placeholder routes for future milestones.
- No empty pages to represent the roadmap.

## Validation Notes

When changing routes, verify:

- server and client component boundaries;
- route compilation and production build;
- metadata behavior when metadata changes;
- responsive rendering when UI changes;
- global validation commands from the root instructions.
