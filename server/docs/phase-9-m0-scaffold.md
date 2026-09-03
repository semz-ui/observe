# Phase 9 · M0 — Scaffold and prove the pipe

← [Phase 9 overview](phase-9-dashboard.md) · next: [M1](phase-9-m1-shared.md)

**Goal:** `dashboard/` exists, its tooling matches the rest of the repo, and one page
renders data fetched from the live API.

---

## Concept to get straight first

**Server Components vs Client Components, and why the fetch lives on the server.**

The API only sends CORS headers on `/v1/events` (`server/src/main.ts:12`), so browser
JS on a different origin cannot read `/api/projects` or `/v1/stats` at all. Every read
therefore runs on Next's server: a Server Component for first paint, a Route Handler
for anything the client polls.

Worth internalising now, because it decides the shape of every later milestone — and
because it is what makes M7 (auth) a one-file change instead of a rewrite.

---

## Build

- `create-next-app` in `dashboard/` — App Router, TypeScript, Tailwind, `src/` dir.
- `pnpm dlx shadcn@latest init`.
- **`tsconfig.json`** — copy the *SDK's* strictness, not the server's. The server's
  config is the loose Nest starter (`noImplicitAny: false`, `strictBindCallApply: false`);
  `typescript-sdk/tsconfig.json` has `strict: true` and `noUncheckedIndexedAccess: true`,
  which is the better precedent for new code. There's no shared base config to extend,
  so this is a copy.
- **`.prettierrc`** — copy `server/.prettierrc` verbatim:
  `{ "singleQuote": true, "trailingComma": "all" }`. It's the only prettier config in
  the repo.
- **`eslint.config.mjs`** — model on `server/eslint.config.mjs`. Note that prettier runs
  *through* eslint there (`eslint-plugin-prettier/recommended`) rather than as a separate
  CI step; matching that keeps the CI job shorter.
- **`pnpm-workspace.yaml`** carrying only `allowBuilds`. This file is *not* declaring a
  workspace — both existing packages have one for the same reason. pnpm 11 fails the
  install until each dependency's build script is approved, and Next pulls native builds
  (`@tailwindcss/oxide`, `sharp`, and friends). Copy the comment style from
  `typescript-sdk/pnpm-workspace.yaml` so the next reader doesn't think this is a workspace.
- **Dev server on port 3001** — 3000 is the API, 4173 is the SDK demo (`pnpm demo`).
- `.env.local` and a committed `.env.example`: `OBSERVE_API_URL=http://localhost:3000`.
- A temporary `/` page that server-fetches `GET /health` and prints the status. Throw it
  away in M1 — it exists only to prove the pipe.

---

## Decisions for you

- **Scripts.** Plain `dev` / `build` / `start` / `lint` / `test`, or convenience scripts
  in the spirit of the SDK's `pnpm demo`?
- **ESLint.** Next's own config, or the flat config from `server/` extended with the Next
  plugin? The second is more consistent with the repo but more setup.
- **Where the temporary health page lives** — `/` or `/debug`. If `/` will become a
  redirect to `/projects` in M2, `/debug` saves you a rewrite.

---

## Doc corrections in this milestone

Two existing docs still describe the dashboard as React + Vite:

- `CLAUDE.md:21` — "`dashboard/` (planned) — React + Vite + TanStack Query + Recharts UI".
- `plan.md` Phase 9 — "`dashboard/` — React + Vite + TypeScript, TanStack Query, Recharts".
- `plan.md:13` (Stack line) — also still says "pnpm workspaces", which the repo abandoned
  in commit `eccd4e4`. Fix that at the same time.

---

## Done when

`pnpm dev` on 3001 renders the API's health status, fetched server-side, and `pnpm build`
is clean. The two docs above no longer say Vite.
