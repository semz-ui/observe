# Observe — build plan

An Amplitude-style click-analytics product: an npm SDK that websites install to
auto-capture clicks, a NestJS API that ingests and stores the events, and a
dashboard to explore them.

**Working agreement:** Michael writes the code; Claude explains concepts,
reviews, and helps debug. Each phase ends with something runnable — never move
on with a broken checkpoint.

**Stack:** NestJS (modular monolith + clean architecture, see
[ARCHITECTURE.md](../ARCHITECTURE.md)) · Prisma · Postgres 16 (Docker, port
5433) · Redis 7 · pnpm workspaces · React + Vite dashboard · TypeScript
everywhere.

---

## Phase 0 — Server foundation ✅ (done 2026-07-11)

**Goal:** a running NestJS skeleton shaped as a modular monolith.

- [x] NestJS scaffold in `server/`
- [x] Feature-module layout: `src/modules/{health,projects,events}`, each with
      `domain / application / infrastructure / presentation` layers
- [x] Working example slice: `GET /health` → use case → controller
- [x] e2e test for `/health`, `ARCHITECTURE.md`

**Done when:** `pnpm start:dev` serves `/health`; `pnpm test:e2e` passes. ✅

---

## Phase 1 — Domain layer ✅ (done 2026-07-11)

**Goal:** the core types and contracts everything else hangs off. Pure
TypeScript — no Nest, no Prisma imports.

- [x] `modules/projects/domain/entities/project.entity.ts` — `Project`
      (id, name, apiKey, createdAt)
- [x] `modules/events/domain/entities/click-event.entity.ts` — `ClickEvent`
      (id, projectId, anonymousId, sessionId, url, element info, timestamp;
      optional fields chosen deliberately)
- [x] `modules/projects/domain/repositories/project.repository.ts` —
      `ProjectRepository` interface (`findByApiKey`, `create`, …) + DI token
- [x] `modules/events/domain/repositories/click-event.repository.ts` —
      `ClickEventRepository` interface (batch save) + DI token

**Done when:** files compile; nothing in `domain/` imports from other layers
or from node_modules frameworks.

---

## Phase 2 — Database ✅ (done 2026-07-11)

**Goal:** real persistence infrastructure, still behind the domain contracts.

- [x] `docker-compose.yml` with Postgres 16 on **5433** (Homebrew Postgres owns 5432)
- [x] Prisma **7** installed in `server/`; `schema.prisma` with `Project` +
      `Event` models mirroring the domain entities (uuid v7 ids, cjs client
      generated into `src/generated/prisma` — see phase-2.md addendum)
- [x] First migration created and applied
- [x] `PrismaService` in `src/shared/prisma/` (pg driver adapter, connects on
      module init); global `PrismaModule`
- [x] CI: Postgres 16 service container + `prisma generate`/`migrate deploy`
      steps

**Done when:** `docker compose up -d` + `prisma migrate dev` succeed; tables
visible via `prisma studio` or `psql`. ✅ (verified: e2e connects, data
survives compose down/up)

---

## Phase 3 — Projects module

**Goal:** first full vertical slice through all four layers.

- [ ] `CreateProjectUseCase` — generates `obs_<random>` API key; returns the
      plaintext key **once** in the response, stores only its SHA-256 hex
      digest (deterministic hash so `findByApiKey` can hash-then-lookup;
      bcrypt would break lookup)
- [ ] `ListProjectsUseCase` (never returns keys — they're unrecoverable)
- [ ] `PrismaProjectRepository` implements `ProjectRepository`
- [ ] `ProjectsController`: `POST /api/projects`, `GET /api/projects`
- [ ] DI binding in `projects.module.ts` (interface token → Prisma class)
- [ ] Unit test of the use case with an in-memory fake repository

**Done when:** creating a project via curl returns an API key and the row is
in Postgres; unit tests pass without a database.

---

## Phase 4 — Event ingestion

**Goal:** the public endpoint the SDK will talk to.

- [ ] `POST /v1/events` accepting `{ apiKey, events: [...] }`
- [ ] Validation DTOs (class-validator) — never trust outside JSON
- [ ] API-key → project lookup via a provider **exported by the projects
      module** (module-boundary rule; no deep imports); lookup hashes the
      incoming key (SHA-256) before querying
- [ ] `IngestEventsUseCase` + `PrismaClickEventRepository` bulk insert
- [ ] CORS open on `/v1/events` (any website must be able to POST)

**Done when:** a curl batch with a valid key returns 202 and rows land in the
events table; an invalid key gets 401; malformed events get 400.

---

## Phase 5 — SDK npm package

**Goal:** the installable tracker — the product's front door.

- [ ] Monorepo root: `git init`, root `package.json` (private),
      `pnpm-workspace.yaml` covering `server`, `packages/*`
- [ ] `packages/sdk` (`@observe/sdk`): `init({ apiKey, apiHost })`
- [ ] Click autocapture: capture-phase document listener; element tag, id,
      text (truncated), CSS-selector builder, href, page URL
- [ ] Identity: anonymous ID in localStorage; session ID with 30-min
      inactivity timeout
- [ ] Transport: batching queue (flush at 5 s / 20 events), `sendBeacon` on
      pagehide so events survive navigation
- [ ] tsup builds: ESM + CJS + IIFE (`window.Observe` for script tags)
- [ ] `examples/demo-site` — plain HTML page using the IIFE build

**Done when:** clicking around the demo site produces rows in Postgres with
correct selectors, session IDs persist across clicks, and closing the tab
mid-batch still delivers events.

---

## Phase 6 — Analytics queries

**Goal:** turn raw events into answers — the read side of the product.

- [ ] Stats endpoints on the events module, date-range params (`from`/`to`):
  - totals: events, unique visitors, sessions
  - events-per-day time series
  - top clicked elements (by selector)
  - top pages
- [ ] Recent-events feed endpoint (paginated)

**Done when:** curl returns correct numbers for known test data (verify by
hand against SQL).

---

## Phase 7 — Authentication

**Goal:** real users own their projects; dashboard endpoints stop being public.

- [ ] `modules/auth` + `User` entity; Prisma migration adding `users` and
      `projects.user_id`
- [ ] Register + login endpoints; passwords hashed with bcrypt
- [ ] JWT access tokens (`@nestjs/jwt`) + auth guard
- [ ] Guard applied to `/api/projects` and stats endpoints; `/v1/events`
      stays API-key-only (the SDK can't hold user tokens)

**Done when:** unauthenticated requests to project/stats endpoints get 401;
each user sees only their own projects; ingestion still works with just an
API key.

---

## Phase 8 — Redis (infrastructure done early — 2026-07-11)

**Goal:** speed and protection on the hot paths.

- [x] Redis 7 added to `docker-compose.yml` (host port **6380** — another
      local container publishes 6379; healthcheck; no volume, cache data is
      disposable) + CI service container
- [x] Redis client in `src/shared/redis/` (`RedisService` extends ioredis,
      fail-fast on missing `REDIS_URL`, disconnects via shutdown hooks;
      global `RedisModule`); feature modules must still consume it behind
      their own interfaces (dependency rule applies to caches too)
- [ ] Cache API-key → project lookups on the ingest path (short TTL)
- [ ] Cache hot analytics queries (short TTL, keyed by project + range)
- [ ] Rate limiting on `/v1/events` (`@nestjs/throttler` with Redis storage)

**Done when:** repeated stats calls hit the cache (verify via logs/timing);
hammering ingestion returns 429; a cached API key skips the DB round trip.

---

## Phase 9 — Dashboard

**Goal:** the website where you actually *see* the clicks.

- [ ] `dashboard/` — React + Vite + TypeScript, TanStack Query, Recharts
- [ ] Login page (JWT from Phase 7)
- [ ] Projects list + create flow (shows API key + copy-paste install snippet
      **once, at creation** — hashed storage means it can't be shown again)
- [ ] Project detail: stat cards, clicks-over-time chart, top elements +
      top pages tables, recent-events feed (polling)

**Done when:** full loop works — log in, create project, install snippet on
demo site, click around, watch the dashboard update.

---

## Phase 10 — Polish (later)

Ideas, not commitments: publish the SDK to npm · page-view + custom events ·
funnels / retention · CI pipeline · deploy somewhere real.
