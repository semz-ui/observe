/**
 * Builds a CSS selector that identifies a clicked element well enough to group
 * clicks together in the dashboard. It is a *label*, not a guarantee: two runs
 * of the same page must produce the same string, but nobody re-queries it.
 *
 * Strategy — walk up from the element, describing each node, and stop early at
 * the first id (an id is already unique on a well-formed page). Depth is capped
 * so a deeply nested SPA doesn't produce a 40-part selector nobody can read.
 */

/** How many ancestors to include before giving up on more context. */
const MAX_DEPTH = 5;
/** The server caps `elementSelector` at 1024 chars (`@MaxLength(1024)`). */
const MAX_LENGTH = 1024;

function escapeIdent(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  // Older engines: escape everything outside the safe identifier set, which is
  // conservative but always produces a parseable selector.
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

/** One path segment: `#id`, `tag`, or `tag:nth-of-type(n)` when ambiguous. */
function describeNode(el: Element): string {
  if (el.id) return `#${escapeIdent(el.id)}`;

  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;

  const sameTag = Array.from(parent.children).filter(
    (child) => child.tagName === el.tagName,
  );
  if (sameTag.length < 2) return tag; // unambiguous among its siblings

  return `${tag}:nth-of-type(${sameTag.indexOf(el) + 1})`;
}

export function buildSelector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;

  for (let depth = 0; node && depth < MAX_DEPTH; depth++) {
    const part = describeNode(node);
    parts.unshift(part);
    if (part.charAt(0) === '#') break; // an id ends the climb

    node = node.parentElement;
    if (!node || node.tagName === 'BODY' || node.tagName === 'HTML') break;
  }

  // Trim from the left (least specific end) until it fits the server's cap.
  while (parts.length > 1 && parts.join(' > ').length > MAX_LENGTH) parts.shift();

  const selector = parts.join(' > ') || el.tagName.toLowerCase();
  return selector.slice(0, MAX_LENGTH);
}
