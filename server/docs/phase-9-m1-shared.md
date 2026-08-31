# Phase 9 · M1 — `shared/` kernel

← [M0](phase-9-m0-scaffold.md) · [Phase 9 overview](phase-9-dashboard.md) · next: [M2](phase-9-m2-projects.md)

**Goal:** the foundation both feature modules sit on — one typed way to reach the API,
one place errors are normalised, and the app shell.

---

## Concept to get straight first

**Parse, don't validate — at the network boundary.**

The API has no OpenAPI spec and no generated client, so nothing today would tell you if
a response shape changed. A schema parse at the edge is the only thing that catches
drift, and it's what lets every layer above treat the data as trustworthy.

The corollary: **the ViewModel should never see a raw `Response`.** By the time data
reaches `application/`, it is a domain type or an error — not a status code.

---

## Build

### `shared/api/http.ts`

A small typed `fetch` wrapper:

- `import 'server-only'` at the top, so a client component importing it fails at build
  time rather than at runtime with a confusing CORS error.
- Base URL from `OBSERVE_API_URL`.
- **Flattens Nest's error shape.** A 400 comes back as
  `{ statusCode, message: string[], error }` — `message` is an *array* of
  class-validator strings, and only for 400s; other statuses give a plain string. Collapse
  that into one error type here rather than leaking the union into every caller.

### `shared/api/schemas`

One schema per response, parsed at the boundary. Two API quirks to encode:

- Optional event fields are **absent** from the JSON, not `null`
  (`prisma-event-feed.repository.ts:27-42`). `.optional()`, not `.nullable()`.
- Events carry `timestamp` but **not** `createdAt`.

### App shell

Sidebar, header, a slot for the project switcher M2 fills, and dark mode via CSS
variables (shadcn's token setup already gives you this).

### shadcn primitives this phase needs

`button table card badge input select skeleton dialog dropdown-menu` — already
installed.

Two things about the setup, because the CLI's defaults fight this layout:

- It was initialised with `shadcn init -b radix -p nova`. `--base-color` no longer
  exists; `-b` now picks the primitive library (`base` | `radix` | `aria`) and `-p`
  picks a preset. Without `-p` the CLI prompts and will hang a non-interactive run.
- The aliases in `components.json` are redirected to `@/shared/ui`, `@/shared/lib`
  and `@/shared/hooks`. The CLI defaults to `@/components/ui` plus a separate
  `@/lib/utils`, which would leave two competing "shared" roots. Because the
  redirect lives in `components.json`, later `shadcn add` calls land in the right
  place on their own — but generated components come double-quoted and
  semicolon-less, so run `pnpm exec prettier --write "src/shared/**/*.{ts,tsx}"`
  after adding any.

---

## Decisions taken

- **Schemas live in each module's `domain/`** — `modules/events/domain/event.ts` owns the
  `Event` type and its schema. This keeps `shared/` thin and a module self-contained,
  matching the server's layering. The cost is that the API's quirks get restated per
  module; the list in the overview doc is the single source to restate *from*.
- **`http.ts` throws a typed `ApiError`** carrying `status` and a flattened message,
  rather than returning a `Result` union. TanStack Query catches throws natively and
  turns them into `isError`/`error`, and in a Server Component the throw bubbles to
  `error.tsx` — so a `Result` would only be unwrapped and re-thrown at every boundary.
- **zod** at the parse boundary, with the domain type `infer`red from the schema so the
  type and the runtime check cannot drift.

---

## Done when

The shell renders with a placeholder page, dark mode toggles, and `http.ts` has a unit
test proving it flattens a Nest validation error (`message: string[]`) into a single
usable message.
