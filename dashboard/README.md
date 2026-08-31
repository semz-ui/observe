# dashboard

The observe dashboard — Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui.

A **standalone package**, like `typescript-sdk/`: its own `package.json` and
`pnpm-lock.yaml`, and a `pnpm-workspace.yaml` that exists only to carry pnpm's
`allowBuilds` approvals. It is *not* in a workspace with `server/`.

```bash
pnpm install
pnpm dev         # :3001 — 3000 is the API, 4173 is the SDK demo
pnpm build       # also the full type-check
pnpm lint        # eslint, non-fixing (the flat config from server/, plus the next plugin)
pnpm typecheck   # next typegen && tsc --noEmit
```

Point `OBSERVE_API_URL` at a running API (`.env.example` has the local default).

## Why every read runs server-side

The API sends CORS headers on `/v1/events` only — deliberately, since `/api/*`
and `/v1/stats` have no auth until server Phase 7. Browser JS on another origin
therefore cannot read them at all, so the dashboard fetches through Server
Components and Route Handlers rather than from the client.

That makes this a Backend-for-Frontend, which is the right shape regardless:
when auth lands, the JWT lives in an httpOnly cookie on the Next origin and
never reaches client JS.

## Layout

Modular monolith with MVVM inside each module, mirroring `server/ARCHITECTURE.md`:
`domain/` (types) → `infrastructure/` (API client) → `application/` (ViewModel
hooks) → `presentation/` (dumb components), with cross-module imports going
through each module's `index.ts`.

The milestone docs live in `server/docs/` — start at
[`phase-9-dashboard.md`](../server/docs/phase-9-dashboard.md).

## Notes

- `next typegen` is not optional: `LayoutProps`/`PageProps` are generated into
  `.next/types`, so a bare `tsc --noEmit` on a clean checkout cannot resolve them.
- `next dev` rewrites `AGENTS.md` on every run, so it is committed as-is.
