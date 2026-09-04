# Phase 9 — Dashboard

The website where a product team picks a project, watches clicks arrive live, and
reads aggregates. This is the overview doc; each milestone has its own doc, listed
below, and can be picked up independently.

**Working agreement applies:** Michael writes the code. Each milestone doc states the
concept to get straight first, what to build, and the decisions left open on purpose.

---

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Framework | Next.js, App Router | A server-side data layer is required (see the constraint below); RSC gives it for free. |
| Design system | shadcn/ui + Tailwind | Components land in the repo as source you own and can read; tokens are CSS variables, no black-box theming engine. |
| Architecture | Modular monolith + MVVM | Mirrors [ARCHITECTURE.md](../ARCHITECTURE.md); each feature module owns its full stack. |
| ViewModel form | Hook — `useXxxViewModel()` | Owns state + fetching, returns plain view state. Unit-testable without rendering, and it doesn't fight Server Components. |
| Auth | Deferred to M7 | The read endpoints are already public; JWT slots in behind the same data layer later. |
| First screen | Live events feed | Exercises layout + data layer + table + pagination with no charting decisions on day one. |

This supersedes the "React + Vite" line that Phase 9 in [plan.md](plan.md) carried
until M0.

---

## The constraint that shapes everything: the browser cannot call the API

`server/src/main.ts:12` applies CORS to `/v1/events` only — deliberately. Its comment:

> any website must be able to POST to `/v1/events`, but only there — the `/api/*`
> endpoints have no auth until Phase 7, so a missing preflight is the one thing
> keeping other sites' JS off them until then

So **every dashboard read goes through Next's server side**: Server Components for
first paint, Route Handlers for anything the client polls. That is a
Backend-for-Frontend, and it is the right shape independent of CORS — when Phase 7
lands, the JWT lives in an httpOnly cookie on the Next origin and never touches
client JS.

**No server change is needed for this phase.** Resist the urge to widen CORS; that
would expose unauthenticated endpoints to every origin to save one Route Handler.

---

## Structure

`dashboard/` is a standalone package like `typescript-sdk/`: its own
`package.json`, its own `pnpm-lock.yaml`, and a `pnpm-workspace.yaml` that exists
only to carry `allowBuilds` approvals. No root manifest — commit `eccd4e4` removed
one on purpose.

```
dashboard/src/
  app/                          # App Router: routing + composition ONLY
    (dashboard)/
      layout.tsx                #   shell: sidebar, project switcher
      projects/page.tsx
      projects/[projectId]/page.tsx          # overview
      projects/[projectId]/events/page.tsx
    api/                        # Route Handlers = the BFF edge the client polls
  modules/
    projects/
      domain/                   # types + schemas. No React, no fetch.
      infrastructure/           # server-only API client (the "Model")
      application/              # use-*-view-model.ts, query keys
      presentation/             # dumb components
      index.ts                  # public barrel — other modules import ONLY this
    events/
    analytics/
  shared/
    api/                        # http client, env, error normalisation
    ui/                         # shadcn components
    lib/
```

## MVVM mapping

- **Model** — `domain/` types + `infrastructure/` API client. Plain TS, no React.
- **ViewModel** — a hook in `application/`. Owns TanStack Query, local UI state
  (filters, pause toggle, pagination), and derived values. Returns a flat view-state
  object. **Zero JSX.**
- **View** — `presentation/` components. Props in, JSX out. No `useQuery`, no `fetch`.

The rule that makes this enforceable: **if a component imports anything from
`infrastructure/`, the ViewModel is missing.** Same spirit as the server's
dependency rule.

**When does a ViewModel exist?** (Decided in M2, and every module after follows it.)
The moment a screen owns client state. A Server Component doing a static read calls
`infrastructure/` directly and passes props down — no ViewModel, because there would be
nothing in it. So `/projects` has none and the project switcher does.

**Where state lives.** Four homes, and the boundaries between them are what stop any one
of them becoming a dumping ground:

| Kind | Home | Example |
| --- | --- | --- |
| Server state | TanStack Query | projects, events, stats — a cache of someone else's data |
| Addressable state | the URL | which project is in scope; a link worth sending |
| Preferences | zustand (`shared/store/`, persisted) | feed pause, poll interval |
| Ephemera | `useState` in the component | a menu being open, which row's dialog is showing |

A preference earns the store by outliving the component that set it and following the
reader between pages, while being something nobody wants in a link. A persisted store
uses `skipHydration` and rehydrates after mount, so the first client render still matches
what the server sent.

The module boundary rule carries over too: cross-module imports go through
`modules/<name>/index.ts`, never deep into another module's folders.

---

## Milestones

| Doc | Milestone |
| --- | --- |
| [m0](phase-9-m0-scaffold.md) | Scaffold, tooling, prove the pipe |
| [m1](phase-9-m1-shared.md) | `shared/` kernel — HTTP layer, schema boundary, app shell |
| [m2](phase-9-m2-projects.md) | `projects` module (read) — first vertical slice |
| [m3](phase-9-m3-events.md) | `events` module — the live feed ← *first screen we ship* |
| [m4](phase-9-m4-analytics.md) | `analytics` module — overview + charts |
| [m5](phase-9-m5-create-project.md) | Create project + one-time key reveal |
| [m6](phase-9-m6-testing-ci.md) | Testing + CI |
| [m7](phase-9-m7-auth.md) | Auth wiring — *blocked on server Phase 7* |

---

## API reference, as built today

| Route | Query / body | Response |
| --- | --- | --- |
| `GET /health` | — | `{ status, timestamp }` |
| `GET /api/projects` | — | `[{ id, name, createdAt }]` |
| `POST /api/projects` | `{ name }` — trimmed, 1–100 chars | `{ id, name, apiKey, createdAt }` — key plaintext **once** |
| `GET /v1/events/recent` | `projectId` required; `limit?` 1–100 (default 50); `cursor?` **must be a valid UUID** | `{ events: [...], nextCursor: string \| null }` |
| `GET /v1/stats` | `projectId`, `from`, `to` — all required ISO-8601; range is half-open `[from, to)` | `{ totals, eventsPerDay, topElements, topPages }` |

Quirks worth encoding once, in `shared/api`, rather than rediscovering per module:

- There is **no global prefix and no versioning API** — paths are literal on the
  controllers, which is why `/api/*` and `/v1/*` coexist.
- Optional event fields are **omitted** from the JSON, not `null`
  (`prisma-event-feed.repository.ts:27-42`).
- Events expose `timestamp` (client click time) but **not** `createdAt` (server
  receive time). If you ever need "how long did ingestion lag", the API can't answer it yet.
- Errors are Nest defaults — `{ statusCode, message, error }` — where `message` is a
  **`string[]`** for 400s and a plain string otherwise.
- `ValidationPipe({ whitelist: true })` **silently drops** unknown params instead of
  rejecting them. A query param the DTO doesn't declare does nothing, with no error.

---

## Conventions

Branch `phase-9-dashboard-<milestone>`, merged via PR. Commit messages lowercase and
phase-prefixed: `phase 9 (M1): shared http layer + app shell`. Comments explain
*why*, usually by naming the constraint — see `server/src/main.ts:9-11` for the tone.
