import type { ClickEvent } from '../domain/event';

/**
 * Sliced out of the ISO string rather than formatted with Intl: this table is
 * server-rendered for first paint and hydrated in the browser, and a
 * locale/timezone-aware format would differ between the two. The column says
 * UTC so the reader is not misled.
 */
export function timeOfDayUtc(timestamp: string): string {
  return timestamp.slice(11, 19);
}

/** The path is what identifies a page in a feed; the origin repeats forever. */
export function pathOf(url: string): string {
  try {
    const { pathname, search } = new URL(url);
    return `${pathname}${search}`;
  } catch {
    // The API stores whatever the SDK sent, and does not validate it as a URL.
    return url;
  }
}

/** `<button#cta>` — the tag with whichever identifier the event actually has. */
export function describeElement(event: ClickEvent): string {
  const identifier = event.elementId === undefined ? '' : `#${event.elementId}`;
  return `${event.elementTag}${identifier}`;
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}
