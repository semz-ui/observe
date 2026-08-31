# Phase 9 · M5 — Create project + one-time key reveal

← [M4](phase-9-m4-analytics.md) · [Phase 9 overview](phase-9-dashboard.md) · next: [M6](phase-9-m6-testing-ci.md)

**Goal:** the first mutation, and a genuine UX constraint that the storage design forces.

---

## Concept to get straight first

**Server Actions vs Route Handlers, and revalidation.**

Worth the detour: this is where Next's model differs most from the React + Vite app
`plan.md` originally imagined. In a Vite app every mutation is a `fetch` + a manual
cache invalidation; here you have a second option that skips the client entirely.

---

## Build

- `POST /api/projects` with `{ name }` — trimmed, 1–100 chars (`create-project.dto.ts:4-13`).
- Response: `{ id, name, apiKey, createdAt }`.
- Invalidate / revalidate the projects list on success.

### The one-time key reveal

The response is **the only moment the plaintext `obs_…` key exists**. Storage keeps a
SHA-256 digest (`api-key.ts:5-11`) — a deterministic hash so `findByApiKey` stays an
indexed lookup, which also means it is genuinely, permanently unrecoverable. `GET
/api/projects` doesn't return the field at all.

So the reveal dialog must:

- show the key plus a copy-paste install snippet,
- warn explicitly that it will not be shown again,
- and **not be dismissible by accident** — no click-outside, no Esc. Require an explicit
  "I've copied it" action.

This is the one place in the dashboard where a careless modal costs the user a real
thing they can't get back.

---

## Decisions for you

- **Server Action, or Route Handler + TanStack mutation?** Actions are more idiomatic in
  App Router and skip a hop; a Route Handler keeps the data layer uniform with M3 and
  keeps the mutation testable the same way the queries are. Either is defensible — pick
  one and document it in the overview.
- **Where the install snippet comes from** — copied from the SDK README, or generated in
  the UI from the new key? Generating it means the snippet is correct and pasteable, but
  it's a second place that has to track the SDK's API.
- **What happens right after creation** — route into the new project's (empty) events
  page, or stay on the list?

---

## Done when

Creating a project from the UI produces a working key that the demo site can ingest with,
and the events feed for that project starts filling.
