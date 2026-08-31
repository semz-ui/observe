# Phase 9 · M4 — `analytics` module: project overview

← [M3](phase-9-m3-events.md) · [Phase 9 overview](phase-9-dashboard.md) · next: [M5](phase-9-m5-create-project.md)

**Goal:** the project overview — KPI cards, events over time, top elements and top pages.

---

## Build

### `infrastructure/stats.api.ts`

`GET /v1/stats?projectId&from&to`. All three params required, `from`/`to` ISO-8601, and
the range is **half-open `[from, to)`** — so "today" means `to` = tomorrow's midnight,
not tonight's.

Response:

```ts
{
  totals:       { events: number; uniqueVisitors: number; sessions: number },
  eventsPerDay: [{ day: "YYYY-MM-DD", count: number }],   // UTC
  topElements:  [{ selector: string, count: number }],    // max 10
  topPages:     [{ url: string, count: number }]          // max 10
}
```

### `application/use-project-stats-view-model.ts`

Owns the date-range state and maps `eventsPerDay` into chart-ready rows. Note that days
with zero events are simply **absent** from `eventsPerDay` — the ViewModel has to fill
the gaps, or the chart will draw a straight line across missing days and lie.

### `presentation/`

Four KPI cards, an events-over-time chart, two top-N tables.

---

## Two API limits to design around, not fight

- **Top-N is hard-fixed at 10.** `topLimit` exists on the use case
  (`get-project-stats.use-case.ts:27`) but is not on the DTO, and
  `ValidationPipe({ whitelist: true })` strips it from the query — so a page-size control
  would silently do nothing at all. Label the tables "Top 10" and move on.
- **Buckets are UTC calendar days only.** `to_char(date_trunc('day', timestamp AT TIME
  ZONE 'UTC'), 'YYYY-MM-DD')`. There is no hourly granularity, so a "Last 24 hours" range
  renders as two bars. Offer day-granularity ranges only — 7d / 30d / custom.

Both are worth a short server-side follow-up later. Note them in `plan.md` Phase 10
rather than building UI that pretends they don't exist.

---

## Charting

`plan.md` specs Recharts. **Load the `dataviz` skill before writing chart code** — it
covers palette, axis, and stat-tile conventions, and keeps the chart consistent with the
shadcn tokens in both light and dark.

---

## Decisions for you

- **Default range.** 7d is the usual choice. Does it persist per project, and where —
  URL search params (shareable, survives refresh) or localStorage?
- **Deltas on the KPI cards?** "+12% vs previous period" needs a second `/v1/stats` call
  over the shifted range. Cheap, but it doubles the requests per page load.
- **Timezone display.** The buckets are UTC. Do you label them UTC explicitly, or convert
  for display and accept that a "day" boundary won't match the user's?

---

## Done when

The overview renders real aggregates for a chosen range, and the chart's totals match the
number on the KPI card. (If they don't, it's almost always the half-open range or a
missing zero-day.)
