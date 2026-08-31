# Phase 9 · M2 — `projects` module (read)

← [M1](phase-9-m1-shared.md) · [Phase 9 overview](phase-9-dashboard.md) · next: [M3](phase-9-m3-events.md)

**Goal:** the first full vertical slice. The data shapes are deliberately tiny so the
layering is the lesson rather than the feature.

---

## Concept to get straight first

**Where the seam between a Server Component and a ViewModel falls.**

This milestone sets the pattern M3 and M4 copy. Get it right here and the rest is
repetition; get it wrong and you'll be refactoring three modules.

The question to answer concretely: when a page is a Server Component that already has
the data, what is the ViewModel *for*? (Short version: nothing, until there's client
state. The interesting case is a Server Component that fetches for first paint and
hands the result to a client component as `initialData`.)

---

## Build

```
modules/projects/
  domain/project.ts                       # ProjectSummary { id, name, createdAt }
  infrastructure/projects.api.ts          # listProjects() -> GET /api/projects
  application/use-projects-view-model.ts  # the first ViewModel
  presentation/projects-list.tsx
  presentation/project-switcher.tsx
  index.ts                                # public barrel
```

Routes: `/projects`, plus the `[projectId]` segment that scopes everything downstream.

---

## Note: there is no `GET /api/projects/:id`

The server only has list and create. Resolve the current project by finding it in the
list for now — the list is small and the request is cached. Adding the endpoint is a
short server-side follow-up if it ever grows; note it rather than working around it
with something clever.

---

## Decisions for you

- **Server Component or Client Component + ViewModel?** Static data argues for a plain
  Server Component with no ViewModel at all; consistency with M3 argues for the
  ViewModel from the start. Pick a rule — "a ViewModel exists when there is client
  state, otherwise the Server Component fetches directly" is a defensible one — and
  write it into the overview doc.
- **Project scope in the URL or a global store?** URL (`/projects/[projectId]/…`) is
  recommended: shareable links, and it survives refresh for free without any state
  library.
- **What the switcher does when there are zero projects** — empty state, or route
  straight to the M5 create flow?

---

## Done when

`/projects` lists real projects from Postgres, clicking one routes into project scope,
and a single module owns every layer of that path — `app/` contains routing and
composition only.
