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

## Decisions taken

- **Range lives in the URL** (`?range=7d`), defaulting to 7d. It is addressable state —
  two people looking at "the last 30 days" should be able to send each other the link —
  and it keeps the page a plain server read with no client cache to invalidate. An
  unrecognised value falls back to the default rather than erroring.
- **Deltas, from a second `/v1/stats` over the shifted window.** Both calls run in
  parallel server-side, so the reader waits no longer; it costs the API a second query
  per page view. A bare total answers "how many" but never "is that good".
  Growth from zero reports "no previous period to compare" rather than "+100%", which
  would be a number the data does not contain.
- **Buckets are labelled UTC and left in UTC.** Converting for display would put a
  reader's "day" boundary somewhere in the middle of a bar the server had already
  decided. The events table does the same.
- **Only one chart.** Three headline numbers are stat tiles, not a grouped bar chart;
  ten labelled selectors are a table, not ten colours. Events-over-time is the only
  thing here whose job is a shape.

---

## Chart notes

Written against the `dataviz` skill's procedure — form first, colour last, then look at
the rendered result.

- **Single series, so no legend.** The heading names what is plotted; a box with one
  swatch restates it.
- **The palette is validated, not eyeballed.** The shadcn `nova` preset ships
  `--chart-1..5` as greys (`oklch(… 0 0)`, chroma 0) and identical in both modes — a
  zero-chroma "hue" reads as grey and an unchanged dark value is an automatic flip
  rather than a step chosen for the dark surface. `--chart-series-1` is the validated
  sequential blue, stepped per mode and checked against the card surface in each
  (lightness band, chroma floor, ≥ 3:1 contrast; both PASS).
- **Linear interpolation, not a spline.** These are discrete UTC-day buckets, and a
  smoothed curve draws values between them that the data does not have.
- **One direct label: the peak.** A value on every point is noise; the axis and the
  tooltip carry the rest. Crosshair and tooltip ship by default, and a "view as a table"
  disclosure means no value is reachable only by hovering.

---

## Done when

The overview renders real aggregates for a chosen range, and the chart's totals match the
number on the KPI card. (If they don't, it's almost always the half-open range or a
missing zero-day.)
