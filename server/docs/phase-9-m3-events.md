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

## Decisions taken

- **Poll every 5s by default, and only while the tab is visible.** TanStack's
  `refetchIntervalInBackground` already defaults to false, so a hidden tab stops on its
  own — no visibility listener. A pause toggle stops it outright, and the reader can
  pick 2s / 5s / 15s / 60s. Both are preferences rather than view state — they outlive
  the screen — so they live in a persisted zustand store, not a `useState` that resets
  on every navigation.
- **Two queries, not one.** The infinite query owns the cursor walk and is never
  refetched: walking a keyset backwards is a one-way trip, and refetching it would cost
  one request per loaded page. A second query polls the head, and `mergeEvents`
  reconciles the two by id. A tick is one request whether you are on page one or page
  ten, and paging deeper never resets.
- **The gap case is surfaced, not hidden.** If more than a page arrives between ticks,
  the polled head and the walked pages share no id, and the rows between them were never
  fetched — the cursor only goes older, so nothing will ever fill them in. `mergeEvents`
  returns `hasGap` and the view says so.
- **Six columns** — when (UTC), element, text, selector, page, visitor — mirroring the
  demo viewer, with all twelve fields in a details dialog. Times are sliced out of the
  ISO string rather than formatted with `Intl`: the table is server-rendered for first
  paint and hydrated in the browser, so a locale-aware format would differ between them.
- **No filters.** The API supports none beyond `projectId`, and filtering only the rows
  already fetched would look like a filter while lying about the result.

---

## Done when

Clicking around the SDK demo site makes rows appear in the table within one poll
interval, "load more" walks the cursor with no duplicates and no gaps, and pause
actually stops the network. The ViewModel has unit tests that never render a component.
