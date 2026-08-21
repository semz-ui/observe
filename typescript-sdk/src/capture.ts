/**
 * Click autocapture: a single capture-phase listener on `document` turns every
 * click into the payload the server's `ClickEventDto` expects (minus identity,
 * which `client.ts` stamps).
 */

import { buildSelector } from './selector';
import type { ClickEvent } from './types';

/**
 * When a click lands on a nested node (the `<span>` inside a `<button>`, a text
 * node), the interesting element is the enclosing control — that's what the
 * user thinks they clicked, and what makes selectors group sensibly.
 */
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [onclick]';

// Mirrors the server's @MaxLength decorators; truncating here keeps a 400 from
// ever being the SDK's fault.
const MAX = {
  tag: 32,
  id: 255,
  text: 255,
  selector: 1024,
  url: 2048,
  title: 512,
} as const;

/** Everything about a click except who did it. */
export type ClickDescription = Omit<ClickEvent, 'anonymousId' | 'sessionId'>;

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Non-empty, whitespace-collapsed, capped — or `undefined` to omit the field. */
function optionalText(value: string | null | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const collapsed = value.replace(/\s+/g, ' ').trim();
  return collapsed ? truncate(collapsed, max) : undefined;
}

/** The element a click should be attributed to, or `null` if there isn't one. */
export function resolveTarget(raw: EventTarget | null): Element | null {
  if (!raw || typeof (raw as Node).nodeType !== 'number') return null;

  const node = raw as Node;
  const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
  if (!el) return null;

  return el.closest(INTERACTIVE) ?? el;
}

function hrefOf(el: Element): string | undefined {
  const attr = el.getAttribute('href');
  if (!attr) return undefined;

  // Anchors and areas expose the resolved absolute URL; anything else with an
  // href attribute keeps whatever it declared.
  const resolved = (el as Partial<HTMLAnchorElement>).href;
  return truncate(typeof resolved === 'string' && resolved ? resolved : attr, MAX.url);
}

export function describeClick(el: Element, now: Date = new Date()): ClickDescription {
  return {
    url: truncate(location.href, MAX.url),
    pageTitle: optionalText(document.title, MAX.title),
    elementTag: truncate(el.tagName.toLowerCase(), MAX.tag),
    elementId: el.id ? truncate(el.id, MAX.id) : undefined,
    elementText: optionalText(el.textContent, MAX.text),
    elementSelector: truncate(buildSelector(el), MAX.selector),
    elementHref: hrefOf(el),
    timestamp: now.toISOString(),
  };
}

/**
 * Listen for clicks in the **capture** phase, so a handler on the page calling
 * `stopPropagation()` can't hide them from us. Returns the detach function.
 */
export function onDocumentClick(handler: (el: Element) => void): () => void {
  const listener = (event: Event): void => {
    const el = resolveTarget(event.target);
    if (el) handler(el);
  };

  document.addEventListener('click', listener, true);
  return () => document.removeEventListener('click', listener, true);
}
