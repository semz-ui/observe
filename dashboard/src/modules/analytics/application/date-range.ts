import type { DailyCount } from '../domain/stats';

/**
 * Ranges the UI offers. Day-granularity only, because the API buckets by UTC
 * calendar day and nothing finer — a "last 24 hours" option would render as two
 * bars and imply a precision the data does not have.
 */
export const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '14d', label: 'Last 14 days', days: 14 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
] as const;

export type RangeValue = (typeof RANGE_OPTIONS)[number]['value'];

export const DEFAULT_RANGE: RangeValue = '7d';

export interface DateRange {
  /** Inclusive, ISO-8601. */
  readonly from: string;
  /** Exclusive — the range is half-open `[from, to)`. */
  readonly to: string;
  readonly days: number;
}

export function isRangeValue(value: unknown): value is RangeValue {
  return RANGE_OPTIONS.some((option) => option.value === value);
}

export function rangeLabel(value: RangeValue): string {
  return RANGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function midnightUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * The last N whole UTC days, today included.
 *
 * `to` is *tomorrow's* midnight rather than tonight's: the range is half-open,
 * so anything else silently drops everything captured today.
 */
export function resolveRange(value: RangeValue, now: Date): DateRange {
  const days =
    RANGE_OPTIONS.find((option) => option.value === value)?.days ?? 7;
  const to = addDays(midnightUtc(now), 1);

  return {
    from: addDays(to, -days).toISOString(),
    to: to.toISOString(),
    days,
  };
}

/** The equal-length window immediately before, for "vs previous period". */
export function previousRange(range: DateRange): DateRange {
  return {
    from: addDays(new Date(range.from), -range.days).toISOString(),
    to: range.from,
    days: range.days,
  };
}

/**
 * Days with no events are **absent** from `eventsPerDay`, not zero. Plotting the
 * response as-is draws a straight line from one populated day to the next, which
 * reads as "steady traffic" when the truth is "nothing happened" — so every day
 * in the range gets a row, whether the API mentioned it or not.
 */
export function fillDays(
  range: DateRange,
  counts: readonly DailyCount[],
): readonly DailyCount[] {
  const byDay = new Map(counts.map((entry) => [entry.day, entry.count]));
  const start = new Date(range.from);

  return Array.from({ length: range.days }, (_, offset) => {
    const day = addDays(start, offset).toISOString().slice(0, 10);
    return { day, count: byDay.get(day) ?? 0 };
  });
}

/**
 * Signed change against the previous period, or null when there is nothing to
 * compare against: growth from zero is not "+100%", it is undefined, and saying
 * otherwise invents a number.
 */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}
