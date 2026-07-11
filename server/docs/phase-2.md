# Phase 2 — Database (Docker Postgres + Prisma)

**Goal:** a real Postgres running in Docker, a Prisma schema mirroring the
Phase 1 domain entities, a first migration applied, and a `PrismaService` the
rest of the app can inject. After this phase nothing *uses* the database yet —
Phase 3 wires it into the projects module.

**Working mode:** step-by-step guide. Steps 1–4 are yours; the `Project`
model in step 3 is a worked example, the `Event` model is your exercise.

---

## Concepts first (read before typing)

- **Why Docker for Postgres?** Your Mac already has a Homebrew Postgres, but
  a containerized one is disposable, versioned (16, same as prod would be),
  and its config lives in the repo so any machine can reproduce it. We map it
  to **port 5433** because Homebrew's Postgres owns 5432.
- **What is a migration?** A versioned SQL file that moves the database
  schema from state N to N+1. You never edit tables by hand — you change
  `schema.prisma`, run `prisma migrate dev`, and Prisma generates + applies
  the SQL and records it in a `_prisma_migrations` table. This is how schema
  changes stay reproducible and reviewable.
- **Prisma's three parts:** `schema.prisma` (your models, the source of
  truth) → `prisma migrate` (turns model changes into SQL) → the generated
  **Prisma Client** (`@prisma/client`, fully typed query API:
  `prisma.project.findUnique(...)`).
- **Clean-architecture note:** Prisma is *infrastructure*. The generated
  client and `PrismaService` may only be imported inside
  `infrastructure/` layers and `src/shared/` — never in `domain/` or
  `application/`. The domain interfaces from Phase 1 stay the only thing use
  cases see.

---

## Step 1 — `server/docker-compose.yml`

Compose file with a single service for now (Redis joins in Phase 8):

- image `postgres:16`
- container name `observe-db`
- env: `POSTGRES_USER=observe`, `POSTGRES_PASSWORD=observe`, `POSTGRES_DB=observe`
- ports: `"5433:5432"` (host:container — the container still thinks it's on 5432)
- a named volume mounted at `/var/lib/postgresql/data` so data survives
  `docker compose down`

Check: `docker compose up -d` then
`psql "postgres://observe:observe@localhost:5433/observe" -c '\conninfo'`.

## Step 2 — Install Prisma

From `server/`:

```bash
pnpm add -D prisma        # the CLI (dev-time tool)
pnpm add @prisma/client   # the runtime client (ships with the app)
npx prisma init           # creates prisma/schema.prisma and .env
```

Point `.env`'s `DATABASE_URL` at
`postgresql://observe:observe@localhost:5433/observe`.
**Add `.env` to `.gitignore`** — it will hold real secrets later; commit a
`.env.example` with the shape instead.

## Step 3 — Models in `prisma/schema.prisma`

`Project` — worked example:

```prisma
model Project {
  id        String   @id @default(uuid())
  name      String
  apiKey    String   @unique @map("api_key")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  events Event[]

  @@map("projects")
}
```

Notes on the choices: `@unique` on `apiKey` because ingestion looks projects
up by key (also gives us the index for free); `@map`/`@@map` keep TypeScript
camelCase while the database stays snake_case (SQL convention);
`@db.Timestamptz` stores timezone-aware timestamps — always do this.

`Event` — **your exercise.** Mirror `ClickEvent` from
`src/modules/events/domain/entities/click-event.entity.ts`. Hints:

- Optional entity fields (`pageTitle?` etc.) become `String?`
- `timestamp` is *client* time → `DateTime @db.Timestamptz`, no default;
  add a separate `createdAt` with `@default(now())` for *server receive time*
- The relation: `project Project @relation(fields: [projectId], references: [id])`
- Add `@@index([projectId, timestamp])` — every dashboard query filters by
  project + time range; without this index those queries scan the whole table
- `@@map("events")` and `@map` the multi-word columns

## Step 4 — First migration

```bash
npx prisma migrate dev --name init
```

Read the generated SQL in `prisma/migrations/*/migration.sql` — confirm the
tables, the unique index on `api_key`, and your `(project_id, timestamp)`
index are there. Then browse the empty tables with `npx prisma studio`.

## Step 5 — `PrismaService` (review together)

`src/shared/prisma/prisma.service.ts`: an `@Injectable()` class that
`extends PrismaClient` and implements `OnModuleInit` (connect) and
`OnModuleDestroy` (disconnect), plus `src/shared/prisma/prisma.module.ts`
marked `@Global()` exporting it, imported once in `app.module.ts`.
This is the one Prisma object the whole app shares — repositories in
Phase 3+ inject it.

---

## Definition of done

- [ ] `docker compose up -d` starts Postgres 16 on 5433; data survives a
      `down`/`up` cycle (volume works)
- [ ] `.env` gitignored, `.env.example` committed
- [ ] `schema.prisma` has `Project` + `Event` matching the domain entities,
      snake_case-mapped, with the `(project_id, timestamp)` index
- [ ] `npx prisma migrate dev` applied; tables visible in `prisma studio`
- [ ] `PrismaService` + global `PrismaModule` exist; `pnpm build` and
      `pnpm test:e2e` still pass
- [ ] You can answer: why does Prisma stay out of `domain/` and
      `application/`? What problem do migrations solve over hand-edited tables?
