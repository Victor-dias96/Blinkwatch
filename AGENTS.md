# Blinkwatch Agent Instructions

This file is the primary instruction source for programming agents working in this repository. These rules apply to the entire project. Closer `AGENTS.md` files complement these global rules with area-specific constraints. When instructions conflict with assumptions, **the real code and configuration in the repository take precedence**.

### Contextual agent instructions

Agents working in a specific area must:

1. Read this root file first.
2. Read the nearest contextual `AGENTS.md` (for example, `src/app/AGENTS.md` when editing routes).
3. Treat local rules as additional restrictions on top of global rules.

Contextual files must not weaken privacy, security, quality, validation, scope control, Git, or responsible model-use rules from this file.

## 1. Project Overview

Blinkwatch is a complementary web platform for horror tabletop RPG sessions. Participants will use their device camera while computer vision runs **locally in the browser** to detect visual gameplay events such as blinks, face absence, and—eventually—attention shifts.

When realtime features are introduced, the system may send **gameplay events** to the game master. It must **not** transmit or store raw images, video streams, or facial data.

Most product functionality is **planned and not yet implemented**. Work incrementally according to the current issue scope.

## 2. Current Project Status

### Implemented

- Next.js App Router base application
- React and TypeScript with strict mode enabled
- Tailwind CSS configured
- shadcn/ui initialized (`components.json`; no UI components added yet)
- Lucide React installed
- Quality tooling: ESLint, Prettier, Tailwind class sorting, import sorting, Husky, lint-staged, Commitlint (Conventional Commits)
- Modular architecture documented in [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md)
- Minimal home page at `src/app/page.tsx`
- Root layout with metadata at `src/app/layout.tsx`
- Shared utility re-export at `src/shared/lib/utils.ts` (`cn` from the `cn` package)
- Test directory placeholder documented in [`tests/README.md`](tests/README.md)

### Not implemented yet

- Camera access and permissions flow
- MediaPipe integration
- Face tracking
- Eye tracking
- Blink detection
- Player calibration
- Realtime rooms and event sync
- Master dashboard
- Database persistence
- Routes: `play`, `master`, `room`, `api`
- Feature modules under `src/features/`
- Layers: `src/domain/`, `src/infrastructure/`, `src/server/`
- shadcn/ui components under `src/shared/components/ui/`
- Test frameworks (Vitest, Testing Library, Playwright, or equivalents)
- ESLint architectural boundary enforcement

## 3. Technology Stack

Documented technologies are those currently present in `package.json` and project configuration. Use `package.json` as the source of truth for versions.

### Runtime and UI

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui (initialized; components added on demand)
- Lucide React

### Quality and Git workflow

- ESLint (`eslint-config-next`, `eslint-plugin-simple-import-sort`)
- Prettier (`prettier-plugin-tailwindcss`)
- Husky
- lint-staged
- Commitlint (`@commitlint/config-conventional`)

### Package manager

- **npm** (lock file: `package-lock.json`)

### Planned but not installed

Do not add or assume these unless the current issue explicitly requires them:

- MediaPipe
- Socket.IO
- Prisma
- PostgreSQL
- Vitest / Testing Library / Playwright
- MCP servers

## 4. Repository Structure

Current physical layout (incremental; not the full planned tree):

```
blinkwatch/
├── docs/
│   └── architecture/
│       └── project-structure.md
├── public/                 # static assets (default Next.js SVGs)
├── src/
│   ├── app/                # App Router pages, layout, globals.css
│   └── shared/
│       └── lib/
│           └── utils.ts    # cn utility re-export
├── tests/
│   └── README.md
├── AGENTS.md
├── components.json         # shadcn/ui configuration
├── package.json
├── README.md
└── config files (eslint, prettier, tsconfig, husky, etc.)
```

### Directory roles

| Path          | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| `src/app/`    | Routing, layouts, page composition, route handlers (when added)      |
| `src/shared/` | Cross-feature reusable code (currently only `lib/utils.ts`)          |
| `docs/`       | Technical documentation                                              |
| `tests/`      | Global tests and shared test resources (framework not installed yet) |
| `public/`     | Static files served by Next.js                                       |

The planned structure—including `features`, `domain`, `infrastructure`, and `server`—is described in [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md). Directories are created only when real files are added.

## 5. Architecture Rules

Follow these rules when introducing or modifying code:

- Organize application functionality primarily by **feature** under `src/features/` when that directory is created.
- Keep App Router files in `src/app/` focused on **routing and composition**.
- Keep framework-independent business rules in `src/domain/` when that layer is introduced.
- Isolate external integrations (MediaPipe, database, realtime clients) in `src/infrastructure/`.
- Keep cross-feature reusable code in `src/shared/`.
- Keep server-only code in `src/server/` when introduced.
- **Do not** import server-only modules into client code.
- **Do not** place MediaPipe logic directly inside React components; use infrastructure adapters consumed by features.
- **Do not** place business rules directly inside route files.
- **Do not** create abstractions without a current use case.
- **Do not** create empty directories or `.gitkeep` files to represent planned architecture.
- **Do not** create barrel files (`index.ts`) automatically.
- Preserve dependency direction documented in [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md):

```
app → features, shared
features → domain, infrastructure, shared
infrastructure → domain
server → domain, infrastructure, shared
domain → (no framework or integration imports)
shared → (no feature-specific imports)
```

## 6. Source Code Conventions

- Keep TypeScript **strict mode** enabled (`tsconfig.json`).
- Avoid `any`; prefer explicit types at module boundaries.
- Use the `@/*` alias for imports from `src/` (maps to `./src/*`).
- Use relative imports only for closely related files in the same area.
- Follow import order enforced by ESLint (`eslint-plugin-simple-import-sort`).
- Let Prettier control formatting; do not hand-format against Prettier output.
- Let the Tailwind Prettier plugin order utility classes.
- Use **named exports** by default for reusable modules.
- Use **default exports** only when required by Next.js (pages, layouts) or an established convention.
- Do not disable ESLint rules without a documented technical reason.
- Do not use `eslint-disable` as a shortcut.
- Do not use `@ts-ignore` to hide errors.
- Use `@ts-expect-error` only when failure is intentional and explained inline.
- Avoid unnecessary client components; default to Server Components.
- Add `"use client"` only when browser APIs, state, effects, or event handlers require it.

### shadcn/ui aliases (from `components.json`)

| Alias                    | Path                     |
| ------------------------ | ------------------------ |
| `@/shared/components`    | shared components        |
| `@/shared/components/ui` | shadcn UI primitives     |
| `@/shared/lib`           | shared libraries         |
| `@/shared/lib/utils`     | `cn` and related helpers |
| `@/shared/hooks`         | shared hooks             |

These target paths may not exist yet; create them only when adding real files.

## 7. Naming Conventions

### Directories

Use **kebab-case**:

- `blink-detection`
- `face-tracking`
- `session-history`

### React components

Use **PascalCase** filenames:

- `CameraPreview.tsx`
- `BlinkAlert.tsx`

### Hooks

Use **camelCase** with the `use` prefix:

- `useCamera.ts`
- `useBlinkDetection.ts`

### Functions

Use **camelCase**:

- `calculateEyeOpenness`
- `formatSessionDuration`

### Types and classes

Use **PascalCase**:

- `BlinkEvent`
- `CameraPermissionState`

### Tests

Use appropriate suffixes:

- `.test.ts` / `.test.tsx` for unit and component tests
- `.spec.ts` for end-to-end tests

Do not rename existing compatible files solely to match these preferences.

## 8. UI Rules

- Use **Tailwind CSS** for styling.
- Use **shadcn/ui** as the preferred foundation for reusable UI components.
- Use **Lucide React** for icons.
- Do not install another component or icon library without justification tied to the current issue.
- Preserve accessibility semantics; use semantic HTML.
- Ensure keyboard accessibility for interactive controls.
- Provide visible focus states.
- Do not use color as the only source of information.
- Keep layouts responsive.
- Do not implement the final horror visual identity before the appropriate issue.
- Do not add decorative complexity outside the requested scope.
- Do not create inactive buttons or misleading controls.

Visual tokens (colors, typography, theme) are not finalized yet.

## 9. Privacy and Camera Safety

These rules are mandatory for any work involving the camera or computer vision.

- Camera access requires **explicit user consent**.
- Video processing must occur **locally in the browser** by default.
- **Do not** send raw camera frames to the server.
- **Do not** record video streams.
- **Do not** capture screenshots automatically.
- **Do not** persist face landmarks unless a future requirement is reviewed and approved.
- **Do not** use facial data for identity recognition.
- **Do not** attempt to identify participants.
- When realtime features exist, transmit **gameplay events only** to the master—not raw sensor data.
- Stop camera tracks when they are no longer needed.
- Handle permission errors clearly for the user.
- Privacy claims in code, UI copy, and documentation must match the real implementation.

**If a task requests storing or transmitting facial data, images, or video without an approved architectural and privacy decision, stop implementation and report the conflict.**

## 10. Dependency Rules

- Inspect existing dependencies before installing a package.
- Prefer platform APIs when they adequately solve the problem.
- Install only dependencies required by the **current issue**.
- Do not add packages for future work.
- Do not use `--force` or `--legacy-peer-deps`.
- Do not downgrade dependencies without an explicit reason.
- Do not replace established tools without justification.
- Use **npm** (the project's package manager).
- Preserve the lock file (`package-lock.json`).
- Register every dependency change in the final report.

## 11. Scope Control

- Implement **only** the requested issue.
- Do not anticipate future issues.
- Do not perform unrelated refactors.
- Do not redesign existing interfaces without a requirement.
- Do not create speculative services, schemas, entities, or hooks.
- Do not change working behavior unless required.
- Prefer the **smallest complete change** that meets acceptance criteria.
- Report problems discovered outside the issue scope instead of fixing them silently.
- Stop if the requested work conflicts with privacy or architecture rules.

## 12. Required Workflow

### Before editing

1. Read the complete issue.
2. Read the nearest applicable contextual `AGENTS.md` in addition to this file.
3. Inspect repository status (`git status`, relevant diffs).
4. Inspect files you will modify or depend on.
5. Identify existing conventions in nearby code.
6. Confirm scripts and package manager (`npm`, `package-lock.json`).
7. Define a short implementation plan.
8. Identify risks and out-of-scope work.

### During implementation

1. Make focused changes.
2. Preserve existing behavior unless the issue requires otherwise.
3. Avoid unrelated formatting changes.
4. Reuse existing abstractions when appropriate.
5. Update documentation when behavior or setup changes.
6. Keep privacy constraints in mind for any camera-related work.
7. Validate assumptions against real code—not documentation alone.

### After implementation

1. Inspect the final diff.
2. Remove accidental or unrelated changes.
3. Run the required validation commands (see below).
4. Confirm the issue acceptance criteria.
5. List remaining limitations and any out-of-scope findings.
6. Provide a factual final report: what changed, commands run, and verification results.
7. Do not declare functionality as implemented unless it exists in the repository.

### Validation commands

Run these before concluding a task that touches code or configuration:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Fix formatting with `npm run format` and safe lint fixes with `npm run lint:fix` when needed.

Commit messages must follow Conventional Commits; hooks run lint-staged on commit and Commitlint on the message.

## 13. Available Commands

All commands use **npm**. Scripts are defined in `package.json`.

```bash
# Development
npm run dev          # start Next.js dev server (http://localhost:3000)
npm run build        # production build
npm run start        # run production build locally

# Code quality
npm run format       # apply Prettier
npm run format:check # verify Prettier formatting
npm run lint         # run ESLint
npm run lint:fix     # run ESLint with safe fixes (includes import sort)
npm run typecheck    # TypeScript check (tsc --noEmit)

# Git hooks (manual)
npm run commitlint   # validate a commit message (see README for examples)
```

Installation: `npm install` (runs Husky `prepare` hook).
