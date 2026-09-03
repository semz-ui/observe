# Phase 9 · M7 — Auth wiring

← [M6](phase-9-m6-testing-ci.md) · [Phase 9 overview](phase-9-dashboard.md)

**Goal:** wire the dashboard to real sessions.

**Blocked on server Phase 7** ([plan.md](plan.md), "Authentication"), and deliberately
last — everything above works against the currently-public read endpoints.

---

## Build

- Login page against the Phase 7 register/login endpoints.
- **JWT in an httpOnly cookie on the Next origin.** Never in client JS, never in
  `localStorage`. The token is set and read only by the server side.
- `middleware.ts` guarding the `(dashboard)` route group; unauthenticated → `/login`.
- `shared/api/http.ts` attaches the token to outgoing calls.

---

## Why this is cheap

Because every read already goes through the server side, this changes **one file in
`shared/api/`** and adds a route. No feature module is touched — no ViewModel, no
component, no `infrastructure/` client.

That is the entire payoff of the BFF decision made back in M0. If this milestone turns
out to be expensive, it means something leaked out of `shared/api/` along the way.

---

## Watch for

- Phase 7 adds `projects.user_id` and scopes `GET /api/projects` per user. The list
  starts returning a subset, so M2's "find the project in the list" shortcut still works
  — but any project id hardcoded in dev config will 404 for the wrong user.
- **`/v1/events` stays API-key-only.** The SDK can't hold user tokens. Don't let the
  middleware or the shared client accidentally attach a JWT to ingestion.
- The CORS line in `server/src/main.ts` was justified by "these endpoints have no auth
  until Phase 7". Once the guard lands, that comment is stale — but the BFF is still the
  right architecture, so this is a comment fix on the server, not a reason to widen CORS.

---

## Done when

Unauthenticated requests redirect to login, each user sees only their own projects, and
SDK ingestion still works with just an API key.
