# Phase 9 · M6 — Testing and CI

← [M5](phase-9-m5-create-project.md) · [Phase 9 overview](phase-9-dashboard.md) · next: [M7](phase-9-m7-auth.md)

**Goal:** tests that match the repo's existing habits, and green CI on a
dashboard-only PR.

---

## Testing

- **vitest + jsdom + Testing Library.** Same runner as the SDK, so there's one test story
  across the front-end packages.
- **Colocate `*.spec.ts` beside the source.** Both existing packages do this —
  `src/capture.ts` next to `src/capture.spec.ts`; neither uses a `__tests__/` directory.
- Mirror the SDK's vitest config where it applies: `restoreMocks: true`,
  `unstubGlobals: true`.
- **ViewModel tests are the priority.** They cover the logic — cursor walking,
  de-duplication, pause, gap-filling in the stats series — without rendering anything.
  That's the payoff of keeping JSX out of `application/`; if a ViewModel is hard to test
  without a render, it's holding view concerns it shouldn't.
- Component tests only where the rendering itself is the risk (the key-reveal dialog's
  dismissal guard is a good candidate).

---

## CI — `.github/workflows/dashboard-ci.yml`

Mirror `sdk-ci.yml`:

- `on: push` (branches `[main]`) and `pull_request`, both with
  `paths: ['dashboard/**', '.github/workflows/dashboard-ci.yml']`
- `defaults: run: working-directory: dashboard`
- `actions/checkout@v5` with `persist-credentials: false` — the existing workflows carry
  the comment "test-only workflow — never leave the GITHUB_TOKEN in git config"
- `pnpm/action-setup@v4` with `version: 11`
- `actions/setup-node@v4` with `node-version: 22`, `cache: pnpm`,
  `cache-dependency-path: dashboard/pnpm-lock.yaml`
- Steps: `pnpm install --frozen-lockfile` → lint → build → test

**On step order:** the SDK does typecheck → test → build; the server does lint → build →
test. Next's build already typechecks, so the server's order is the better fit here — a
separate typecheck step would just be a slower duplicate.

No service containers: the dashboard has no database and its tests mock the API.

---

## Decisions for you

- **Does CI need the API running?** If you want a smoke test that actually hits the
  server, that pulls in the Postgres service container and `prisma migrate deploy` from
  `server-ci.yml` — a real jump in complexity. Mocking at `shared/api` is the cheaper
  default.
- **Lint step** — `next lint`, or `pnpm exec eslint` directly? Note the repo convention:
  `pnpm lint` auto-fixes, so CI calls the raw binary so it can't silently pass by
  rewriting files.

---

## Done when

CI is green on a PR touching only `dashboard/`, and it does **not** trigger on server- or
SDK-only PRs (check by pushing a server-only change and confirming the job is skipped).
