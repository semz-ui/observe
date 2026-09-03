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

`button table card badge input select skeleton dialog dropdown-menu`

---

## Decisions for you

- **Where do the schemas live** — `shared/api/`, or each module's `domain/`? Module
  `domain/` is more faithful to the layering and keeps `shared/` thin; `shared/api/` is
  less ceremony and keeps all the API quirks in one file. Either works — pick one and
  write it into the overview doc, because inconsistency here will spread.
- **Error surface from `http.ts`** — a discriminated-union `Result` type, or thrown errors
  caught by TanStack Query and error boundaries? Throwing is more idiomatic with TanStack
  Query; `Result` makes the ViewModel's error handling explicit and easier to unit-test.
- **Validation library** — zod is the default assumption, but nothing in the repo commits
  you to it.

---

## Done when

The shell renders with a placeholder page, dark mode toggles, and `http.ts` has a unit
test proving it flattens a Nest validation error (`message: string[]`) into a single
usable message.
