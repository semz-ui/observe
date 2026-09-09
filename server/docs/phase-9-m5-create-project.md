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

## Decisions taken

- **A Server Action, not a route handler.** The form posts straight to the server, which
  calls the API and `revalidatePath('/projects')`. There is no client cache holding
  projects — the list is a server read — so there is nothing to invalidate by hand, and
  no second network hop.
- **The install snippet is generated from the new key**, so what the reader pastes is
  already correct rather than a README template with a placeholder in it. `apiHost` comes
  from `OBSERVE_API_URL`; in a real deployment the browser-facing ingestion host may
  differ from the dashboard's internal one, and that day this needs its own public env
  var rather than borrowing this one.
- **After "I've copied it", route into the new project's events feed.** Its empty state
  says to install the SDK and click something, which is exactly the next step.

---

## Two traps this milestone hit

- **A `'use server'` file may export only async functions.** Exporting the initial state
  object beside the action throws at module evaluation — and `tsc`, `eslint` and
  `next build` all pass it. It only surfaces when the page is opened. The state type and
  its initial value live in their own module now.
- **`tailwind-merge` replaces a class only within the same variant.** The dialog
  primitive sets `sm:max-w-sm`; an unprefixed `max-w-xl` does not beat it above the
  breakpoint, so the panel stayed narrow while the key and snippet overflowed it. The
  override has to be `sm:max-w-2xl`, and the flex children need `min-w-0` so an
  unbreakable snippet scrolls inside the panel instead of widening it.

---

## Done when

Creating a project from the UI produces a working key that the demo site can ingest with,
and the events feed for that project starts filling.
