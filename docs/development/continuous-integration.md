# Continuous integration

## Purpose

The Blinkwatch repository uses GitHub Actions to validate changes before they are merged. The CI workflow runs the same quality checks that contributors should run locally: formatting verification, lint, TypeScript typecheck, unit/component tests, and a production build.

CI **does not** modify source files, deploy the application, require application secrets, use MCP, access a camera, or persist application data. It complements local Git hooks; passing hooks alone does not replace the full CI validation.

## Workflow location

The workflow is defined at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). The workflow display name is **CI**.

## Trigger events

| Event          | When it runs                                       |
| -------------- | -------------------------------------------------- |
| `pull_request` | On every pull request, regardless of target branch |
| `push`         | On pushes to the `main` branch only                |

The workflow does **not** run on tags, releases, scheduled cron jobs, or manual `workflow_dispatch` triggers.

## Branch behavior

- **Pull requests:** CI runs for all pull requests.
- **Push:** CI runs only when commits are pushed to `main` (the repository default branch).

## Permissions

The workflow requests the minimum permissions required:

```yaml
permissions:
  contents: read
```

It does not request write access to contents, pull requests, issues, packages, deployments, or `id-token`.

## Concurrency

Concurrent runs for the same workflow and Git reference are grouped and older in-progress runs are cancelled:

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This avoids wasting runner time when new commits are pushed to the same branch or pull request. Runs on different branches or references are not grouped together.

## Node.js selection

The workflow uses **Node.js 20**, matching the project requirement documented in the [README](../../README.md) ("Node.js 20 ou superior"). The repository does not currently define `.nvmrc`, `.node-version`, or an `engines.node` field in `package.json`.

## Dependency installation

Dependencies are installed with a reproducible lockfile-based install:

```bash
npm ci
```

This command uses `package-lock.json` and does not update the lockfile. The workflow does not use `npm install`, `--force`, or `--legacy-peer-deps`.

### Husky in CI

The project uses Husky via the `prepare` script, which runs during `npm ci`. In CI, `HUSKY=0` is set only on the install step so Git hooks are not installed in the ephemeral runner environment. Local development behavior is unchanged.

## Cache behavior

The workflow uses the npm cache integrated with `actions/setup-node`, keyed on `package-lock.json`. It does **not** cache `node_modules`, the full `.next` directory, `.env` files, secrets, or application data.

## Validation steps

After installation, the workflow runs these steps in order:

| Step              | Command                | Behavior                          |
| ----------------- | ---------------------- | --------------------------------- |
| Check formatting  | `npm run format:check` | Verifies Prettier; does not write |
| Run lint          | `npm run lint`         | Runs ESLint; does not auto-fix    |
| Run typecheck     | `npm run typecheck`    | Runs `tsc --noEmit`               |
| Run tests         | `npm test`             | Runs Vitest (`vitest run`)        |
| Build application | `npm run build`        | Production Next.js build          |

The workflow does **not** run `npm run format` or `npm run lint:fix`. If any step fails, the job fails.

## Environment variables

The workflow does not define custom application environment variables. The build succeeds without `.env.local` because the project currently requires no external credentials.

GitHub Actions sets `CI=true` automatically; the workflow does not declare it explicitly. `NODE_ENV` is not set manually in the workflow; Next.js and npm scripts control the environment as needed.

## Local reproduction

To reproduce CI validation locally:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

For local fixes before committing:

```bash
npm run format
npm run lint:fix
```

Then re-run the read-only checks above.

### Local hooks vs CI

| Mechanism         | Scope                      | Purpose                          |
| ----------------- | -------------------------- | -------------------------------- |
| Husky hooks       | Staged files on commit     | Fast feedback before commit      |
| GitHub Actions CI | Full repository on push/PR | Complete validation before merge |

Passing pre-commit hooks does not guarantee CI will pass. Always run the full CI command sequence before reporting work as complete.

## Troubleshooting

| Symptom                           | Likely cause                         | Action                                    |
| --------------------------------- | ------------------------------------ | ----------------------------------------- |
| Format check fails                | Unformatted files                    | Run `npm run format`, then `format:check` |
| Lint fails                        | ESLint errors or import order        | Run `npm run lint:fix`, then `lint`       |
| Typecheck fails                   | TypeScript errors                    | Fix types; run `npm run typecheck`        |
| Tests fail                        | Failing Vitest assertions or setup   | Run `npm test` locally                    |
| Build fails                       | Compilation or Next.js config issue  | Run `npm run build` locally               |
| CI passes locally but fails in CI | Different Node version or stale deps | Use Node 20; run `npm ci` before checks   |

## Security restrictions

The CI workflow:

- Uses only official GitHub actions (`actions/checkout`, `actions/setup-node`).
- Does not use secrets or `${{ secrets.* }}`.
- Does not use `pull_request_target`.
- Does not publish artifacts or deploy.
- Does not execute camera or computer vision code.
- Does not use MCP or call external application services.

## Intentionally outside the workflow

The following are **not** part of the current CI pipeline and may be added in future issues:

- Deploy to staging or production
- E2E tests (Playwright or equivalents)
- Dependabot or CodeQL
- Browser or OS matrix builds
- Manual `.next` cache optimization
- Database or authentication setup
- MediaPipe, camera, or Socket.IO validation
- MCP integration
- Branch protection rules (configured in GitHub repository settings, not in this file)
