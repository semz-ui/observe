'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { DEFAULT_RANGE, isRangeValue, type RangeValue } from './date-range';

export interface RangePickerViewState {
  readonly value: RangeValue;
  readonly select: (value: RangeValue) => void;
}

/**
 * The range lives in the URL, not in a store: it is addressable state — two
 * people looking at "the last 30 days" should be able to send each other the
 * link — and it makes the page a plain server read with no client cache to
 * invalidate.
 *
 * An unrecognised `?range=` falls back to the default rather than erroring: a
 * hand-edited URL is not worth an error page.
 */
export function useRangePickerViewModel(): RangePickerViewState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get('range');
  const value = isRangeValue(raw) ? raw : DEFAULT_RANGE;

  const select = useCallback(
    (next: RangeValue) => {
      const params = new URLSearchParams(searchParams);
      params.set('range', next);
      // `replace`, not `push`: flipping between ranges should not stack up
      // history entries the back button has to walk through.
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return { value, select };
}
