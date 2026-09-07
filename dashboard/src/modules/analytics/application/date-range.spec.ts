import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RANGE,
  fillDays,
  isRangeValue,
  percentChange,
  previousRange,
  resolveRange,
} from './date-range';

// Mid-afternoon UTC, so a bug that uses local midnight or "now" instead of the
// day boundary shows up as an off-by-one rather than passing by luck.
const NOW = new Date('2026-09-04T14:32:11.000Z');

describe('resolveRange', () => {
  it('ends at tomorrow midnight so today is included', () => {
    // The API's range is half-open [from, to). Ending at tonight's midnight
    // would silently drop everything captured today.
    const range = resolveRange('7d', NOW);

    expect(range.to).toBe('2026-09-05T00:00:00.000Z');
    expect(range.from).toBe('2026-08-29T00:00:00.000Z');
  });

  it('spans exactly the requested number of days', () => {
    const range = resolveRange('30d', NOW);
    const span = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000;

    expect(span).toBe(30);
    expect(range.days).toBe(30);
  });
});

describe('previousRange', () => {
  it('is the equal-length window ending where the current one starts', () => {
    const current = resolveRange('7d', NOW);
    const previous = previousRange(current);

    expect(previous.to).toBe(current.from);
    expect(previous.from).toBe('2026-08-22T00:00:00.000Z');
    expect(previous.days).toBe(7);
  });

  it('leaves no gap and no overlap between the two windows', () => {
    const current = resolveRange('14d', NOW);
    const previous = previousRange(current);
    const total =
      (Date.parse(current.to) - Date.parse(previous.from)) / 86_400_000;

    expect(total).toBe(28);
  });
});

describe('fillDays', () => {
  it('gives every day in the range a row, zero where the API said nothing', () => {
    // Absent days are the API's way of saying zero. Plotting the response
    // as-is draws a straight line across them, which reads as steady traffic.
    const range = resolveRange('7d', NOW);
    const filled = fillDays(range, [
      { day: '2026-08-29', count: 3 },
      { day: '2026-09-03', count: 5 },
    ]);

    expect(filled).toHaveLength(7);
    expect(filled.map((entry) => entry.count)).toEqual([3, 0, 0, 0, 0, 5, 0]);
    expect(filled[0]?.day).toBe('2026-08-29');
    expect(filled.at(-1)?.day).toBe('2026-09-04');
  });

  it('ignores days the API returned from outside the range', () => {
    const range = resolveRange('7d', NOW);
    const filled = fillDays(range, [{ day: '2020-01-01', count: 99 }]);

    expect(filled.every((entry) => entry.count === 0)).toBe(true);
  });

  it('returns the whole range even when nothing happened at all', () => {
    expect(fillDays(resolveRange('30d', NOW), [])).toHaveLength(30);
  });
});

describe('percentChange', () => {
  it('reports a signed fraction', () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(80, 100)).toBeCloseTo(-0.2);
  });

  it('refuses to compare against nothing', () => {
    // Growth from zero is undefined, not +100%. Inventing a number here is how
    // a dashboard ends up lying on its most prominent element.
    expect(percentChange(50, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });
});

describe('isRangeValue', () => {
  it('accepts the offered ranges and nothing else', () => {
    expect(isRangeValue(DEFAULT_RANGE)).toBe(true);
    expect(isRangeValue('7d')).toBe(true);
    expect(isRangeValue('24h')).toBe(false);
    expect(isRangeValue(undefined)).toBe(false);
  });
});
