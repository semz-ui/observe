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

## Decisions taken

- **A ViewModel exists the moment a screen owns client state; a static read skips it.**
  `/projects` is a plain Server Component that calls `listProjects()` and hands the
  result to a presentational component. The switcher gets a ViewModel because it
  genuinely has state to own — which project the URL is scoped to, and what selecting
  one does. TanStack Query waits until M3, where polling is the thing that needs it.
- **Project scope lives in the URL** (`/projects/[projectId]/…`): shareable links, and
  it survives a refresh with no state library. `useParams` reads the matched segment
  even from the header, which renders above that segment.
- **Zero projects gets an empty state**, not a jump into a create flow that does not
  exist until M5.
- **Menu open/closed is not in the ViewModel.** It belongs to the primitive. A
  ViewModel that mirrors a component's internal state is ceremony, not layering.

---

## Done when

`/projects` lists real projects from Postgres, clicking one routes into project scope,
and a single module owns every layer of that path — `app/` contains routing and
composition only.
