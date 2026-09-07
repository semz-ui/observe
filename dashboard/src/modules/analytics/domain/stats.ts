import { z } from 'zod';

/**
 * `GET /v1/stats`. All three params are required and the range is **half-open**
 * `[from, to)` — so "today" means `to` is tomorrow's midnight, not tonight's.
 *
 * Two limits of the endpoint are worth knowing before reading any of this:
 *
 * - **Top-N is fixed at 10.** `topLimit` exists on the use case but not on the
 *   DTO, and `ValidationPipe({ whitelist: true })` strips unknown params, so a
 *   page-size control would silently do nothing at all.
 * - **Buckets are UTC calendar days.** There is no hourly granularity, so a
 *   "last 24 hours" range would render as two bars. Day-granularity only.
 */
export const projectStatsSchema = z.object({
  totals: z.object({
    events: z.number(),
    uniqueVisitors: z.number(),
    sessions: z.number(),
  }),
  // Days with no events are ABSENT, not zero — see fillDays().
  eventsPerDay: z.array(z.object({ day: z.string(), count: z.number() })),
  topElements: z.array(z.object({ selector: z.string(), count: z.number() })),
  topPages: z.array(z.object({ url: z.string(), count: z.number() })),
});

export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type DailyCount = ProjectStats['eventsPerDay'][number];

/** What the server can actually bucket: whole UTC days. */
export const TOP_N = 10;
