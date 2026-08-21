# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git attribution (important)

**Never add Claude as a contributor.** No `Co-Authored-By: Claude ...` trailers on commits, no Claude attribution in PR descriptions, never `noreply@anthropic.com` anywhere in git history. Michael is the sole author. A global PreToolUse hook blocks commits containing such trailers — do not try to work around it.

## Working agreement (important)

This is a **learning project**: Michael writes the code himself; Claude explains concepts, breaks work into small milestones, reviews his code, and helps debug. Do not implement features wholesale unless he explicitly asks. Prefer small illustrative snippets over complete files, and pose the design decision back to him when it's the kind he should make.

## What this is

"observe" — a simple Amplitude-style product-analytics platform, all TypeScript:

- `server/` — NestJS API
- `typescript-sdk/` — `@observe/sdk`, the script websites install to auto-capture
  clicks. Standalone package with its own pnpm lockfile, **not** a workspace with
  `server/` (see its README)
- `dashboard/` (planned) — React + Vite + TanStack Query + Recharts UI

The roadmap with per-phase deliverables and "definition of done" lives in `server/docs/plan.md` (Phases 0–6 done, plus Phase 8's Redis infrastructure pulled forward; next is Phase 7: authentication). Multi-tenancy is per-project API keys (`obs_<random>`), stored as SHA-256 digests (plaintext shown once at creation; lookups hash first — deterministic hash, not bcrypt, so `findByApiKey` stays an indexed lookup); the public ingestion endpoint will be `POST /v1/events`, authenticated by API key only, while dashboard endpoints get JWT auth in a later phase.

## Commands

Server work happens in `server/`:

```bash
pnpm install                          # pnpm 11; build scripts gated via allowBuilds in pnpm-workspace.yaml
pnpm start:dev                        # dev server with watch, port 3000
pnpm build                            # nest build (also the quickest full type-check)
pnpm exec eslint "{src,test}/**/*.ts" # lint as CI runs it (pnpm lint auto-fixes, CI variant doesn't)
pnpm test                             # unit tests (jest, *.spec.ts under src/)
pnpm test -- path/to/file.spec.ts     # single unit test file
pnpm test -- -t "test name"           # single test by name
pnpm test:e2e                         # e2e tests (test/jest-e2e.json config)
```

CI (`.github/workflows/server-ci.yml`) runs install → lint → build → unit → e2e with Postgres and Redis service containers, path-filtered to `server/**`.

SDK work happens in `typescript-sdk/` (its own install; no eslint there yet):

```bash
pnpm test        # vitest + jsdom (src/**/*.spec.ts)
pnpm typecheck   # tsc --noEmit
pnpm build       # tsup → ESM + CJS + IIFE in dist/
pnpm demo        # build, then serve examples/demo-site on :4173
```

CI for it is `.github/workflows/sdk-ci.yml`, path-filtered to `typescript-sdk/**`.

## Architecture: modular monolith + clean architecture

Full explanation in `server/ARCHITECTURE.md`. The short version future work must respect:

- Feature modules under `src/modules/` (`health`, `projects`, `events`), each with four layers: `domain/` → `application/` → `infrastructure/` → `presentation/`. `src/shared/` holds cross-cutting infra (Prisma service will live there).
- **Dependency rule:** imports only point inward. `domain/` imports nothing from frameworks (no `@nestjs/*`, no Prisma) — check with `grep -r "@nestjs" src/modules/*/domain/`. `application/` imports only domain. Prisma/DB code is confined to `infrastructure/` and `shared/`.
- **Repositories are interfaces owned by domain** (`domain/repositories/*.repository.ts`), implemented in `infrastructure/persistence/`. Because TS interfaces vanish at runtime, each interface exports a `Symbol` DI token (e.g. `PROJECT_REPOSITORY`) that modules bind via `{ provide: TOKEN, useClass: ... }` and use cases inject with `@Inject(TOKEN)`.
- **Module boundary rule:** cross-module needs (e.g. events looking up a project by API key) go through providers *exported* by the other module's `*.module.ts` — never deep imports into another module's folders.
- `app.module.ts` stays minimal: it only imports feature modules.

## Gotchas

- pnpm 11 fails installs when a dependency's build script isn't approved; handled via `allowBuilds` in `server/pnpm-workspace.yaml` (the pre-v11 `ignoredBuiltDependencies` key no longer works).
- Local port collisions: Homebrew Postgres holds 5432 and another container publishes 6379, so the project's Docker services map Postgres → **5433** and Redis → **6380** (locally and in CI).
