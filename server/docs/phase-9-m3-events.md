# Phase 9 · M3 — `events` module: the live feed

← [M2](phase-9-m2-projects.md) · [Phase 9 overview](phase-9-dashboard.md) · next: [M4](phase-9-m4-analytics.md)

**This is the first screen we ship.** A polling, cursor-paginated table of recent
events — and where MVVM earns its keep, because there's finally real client state to own.

---

## Concept to get straight first

**`useInfiniteQuery` over a keyset cursor, not an offset** — and how to unit-test a
ViewModel with vitest without rendering a single component.

The API paginates by keyset (`id < cursor`, newest-first, fetching `limit + 1` to detect
more — `prisma-event-feed.repository.ts:56-68`), not by page number. That's why new
events arriving don't shift your pagination the way `OFFSET` would.

---

## Build

### `infrastructure/events.api.ts`

`recentEvents({ projectId, limit, cursor })` → `GET /v1/events/recent`.

- Newest-first. `limit` is 1–100, default 50.
- **`cursor` must be a valid UUID or the API returns 400** — never forward an empty
  string or `null`. Omit the param entirely on the first page.
- Response: `{ events: [...], nextCursor: string | null }`.

### `app/api/events/recent/route.ts`

The BFF edge. This one exists because the client *polls* it and cannot reach the API
directly — a Server Component alone can't refresh on an interval.

### `application/use-events-feed-view-model.ts`

The reference ViewModel. Owns:

- `useInfiniteQuery` over the cursor, with `getNextPageParam` reading `nextCursor`
- `refetchInterval` polling
- the pause toggle
- derived view state: `rows`, `isEmpty`, `canLoadMore`, `isPolling`

**No JSX in this file.** If you're tempted to put a `<Badge>` in here, that's a
formatter belonging in `presentation/` or a `lib/` helper.

### `presentation/`

`EventsTable`, `EventRow`, `EmptyState`, `TableSkeleton`.

`typescript-sdk/examples/demo-site/viewer.html` is worth reading first — it already
answers "what does this table show" and has the new-row flash affordance
(`@keyframes flash` on `tr.new`).

---

## Decisions for you

- **Poll interval**, and whether it backs off or stops when the tab is hidden.
- **How new rows arrive.** Prepend on poll so the feed grows upward, or refetch page 1?
  Prepending reads better but has to de-duplicate against what the cursor already
  fetched — the event `id` is a uuid v7, so it sorts by time and makes this tractable.
- **Which of the twelve event fields earn a column**, and what goes in a detail drawer.
  The full set: `id, projectId, anonymousId, sessionId, url, pageTitle?, elementTag,
  elementId?, elementText?, elementSelector, elementHref?, timestamp`.
- **Filters.** The API supports none beyond `projectId` — no url, selector, or session
  filter. Client-side filtering of the loaded page is easy but misleading (it only
  filters what you've fetched). Either skip filters this milestone or add the server
  support first.

---

## Done when

Clicking around the SDK demo site makes rows appear in the table within one poll
interval, "load more" walks the cursor with no duplicates and no gaps, and pause
actually stops the network. The ViewModel has unit tests that never render a component.
