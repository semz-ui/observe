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

## Phase 3 — Projects module ✅ (done 2026-07-12)

**Goal:** first full vertical slice through all four layers.

- [x] `CreateProjectUseCase` — generates `obs_<random>` API key; returns the
      plaintext key **once** in the response, stores only its SHA-256 hex
      digest (deterministic hash so lookup can hash-then-query; bcrypt would
      break lookup). Key logic lives in `domain/services/api-key.ts`; the
      entity field is `apiKeyHash` so a stored `Project` can never hold
      plaintext
- [x] `ListProjectsUseCase` (never returns keys — they're unrecoverable)
- [x] `PrismaProjectRepository` implements `ProjectRepository`
      (`create` takes `CreateProjectInput`; Prisma defaults fill id/createdAt)
- [x] `ProjectsController`: `POST /api/projects`, `GET /api/projects`;
      global `ValidationPipe({ whitelist: true })` + `CreateProjectDto`
- [x] DI binding in `projects.module.ts` (interface token → Prisma class)
- [x] Unit test of the use cases with an in-memory fake repository
      (`--passWithNoTests` removed from CI); projects e2e spec

**Done when:** creating a project via curl returns an API key and the row is
in Postgres; unit tests pass without a database. ✅ (verified: 201 + `obs_`
key via curl, `projects.api_key` column matches sha-256 of the returned key,
empty name → 400, list output carries no key fields)

---

## Phase 4 — Event ingestion ✅ (done 2026-07-12)

**Goal:** the public endpoint the SDK will talk to.

- [x] `POST /v1/events` accepting `{ apiKey, events: [...] }` (key in the
      body, not a header — Phase 5's `sendBeacon` can't set headers); 202,
      no response body
- [x] Validation DTOs (class-validator) — nested `@ValidateNested` +
      `@Type`, batch capped at 100 events, timestamps as ISO strings
- [x] API-key → project lookup via a provider **exported by the projects
      module**: `PROJECT_LOOKUP` token + `ProjectLookup` port, re-exported
      through `modules/projects/index.ts` (the module's public barrel — no
      deep imports); lookup hashes the incoming key (SHA-256) before
      querying. Phase 8 can swap in a cached implementation via the binding
- [x] `IngestEventsUseCase` (stamps the resolved projectId — identity comes
      from the key, never the payload; throws framework-free
      `InvalidApiKeyError`, mapped to 401 in the controller) +
      `PrismaClickEventRepository` bulk insert (`createMany`)
- [x] CORS open on `/v1/events` only (`app.use('/v1/events', cors())`) —
      the `/api/*` endpoints keep failing preflights until Phase 7 gives
      them real auth

**Done when:** a curl batch with a valid key returns 202 and rows land in the
events table; an invalid key gets 401; malformed events get 400. ✅ (verified
live + e2e; also: smuggled `projectId` in the payload is overridden, CORS
preflight from an arbitrary origin returns `access-control-allow-origin: *`)

---

## Phase 5 — SDK npm package ✅ (done 2026-08-21)

**Goal:** the installable tracker — the product's front door.

- [x] Standalone `typescript-sdk/` package (`@observe/sdk`) with its own pnpm
      lockfile — *not* a workspace shared with `server/`: the SDK ships onto
      other people's sites and gains nothing from the API's dependency tree
- [x] `init({ apiKey, apiHost, flushInterval?, batchSize?, sessionTimeout? })` —
      idempotent, plus `flush()` and `stop()`; bad config warns instead of
      throwing on a host page
- [x] Click autocapture: capture-phase `document` listener, attributed to the
      nearest enclosing control; CSS-selector builder (stops at the first id,
      `:nth-of-type` only when siblings are ambiguous, depth-capped at 5);
      tag / id / text / href / url / title, every string truncated to the
      server's `@MaxLength` caps so a 400 can't be the SDK's fault
- [x] Identity: anonymous id in localStorage; session id with a 30-min
      inactivity timeout, refreshed on every click; `crypto.randomUUID` →
      `getRandomValues` → `Math.random` fallback chain, and an in-memory store
      when localStorage is missing or starts throwing
- [x] Transport: batching queue (flush at `batchSize` events / `flushInterval`
      ms), `sendBeacon` on pagehide + visibilitychange with a `keepalive` fetch
      backup. Failure policy: 5xx and network errors requeue at the front, 4xx
      drops (retrying a bad key can only fail again), buffer capped at 500 and
      requests at 100 (the DTO's `@ArrayMaxSize`)
- [x] tsup builds: ESM + CJS + IIFE (`window.Observe` for script tags), ~2.8 KB
      min+gzip
- [x] Vitest + jsdom unit tests and `sdk-ci.yml` (typecheck → test → build,
      path-filtered to `typescript-sdk/**`)
- [x] `examples/demo-site` — plain HTML page on the IIFE build, with a live log
      of every batch the SDK posts

**Done when:** clicking around the demo site produces rows in Postgres with
correct selectors, session IDs persist across clicks, and closing the tab
mid-batch still delivers events. ✅ (verified against a live server by driving
the built IIFE bundle in jsdom: four clicks → four rows, one anonymousId and
one sessionId across all of them, a click on the `<span>` inside a button
recorded as the button, `#plans > li:nth-of-type(2)` for the ambiguous sibling,
an absolute `elementHref` for the anchor, and the last click delivered by
`sendBeacon` after `pagehide`)

---

## Phase 6 — Analytics queries ✅ (done 2026-07-20)

**Goal:** turn raw events into answers — the read side of the product.

- [x] Stats endpoints on the events module, date-range params (`from`/`to`):
      `GET /v1/stats`, half-open `[from, to)` range, `EventStatsRepository`
      read port
  - totals: events, unique visitors, sessions
  - events-per-day time series
  - top clicked elements (by selector)
  - top pages
- [x] Recent-events feed endpoint (paginated) — `GET /v1/events/recent`,
      keyset cursor on the uuid-v7 `id` (stable, drift-free); dedicated
      `EventFeedRepository` read port; `@@index([projectId, id])` migration

**Done when:** curl returns correct numbers for known test data (verify by
hand against SQL). ✅ (unit + e2e green; feed paginates newest-first with no
overlap, bad cursor → 400)

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
