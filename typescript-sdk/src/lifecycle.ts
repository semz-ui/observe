/**
 * "The page is going away" is surprisingly hard to detect. `beforeunload` and
 * `unload` are unreliable (and break bfcache); `pagehide` is the modern signal,
 * but mobile Safari can freeze a backgrounded tab without ever firing it — so
 * `visibilitychange` → hidden is registered too.
 *
 * Both can fire for one departure, so the handler must be idempotent: flushing
 * an already-empty queue is a no-op.
 */
export function onPageHide(handler: () => void): () => void {
  const onHide = (): void => handler();
  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') handler();
  };

  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    window.removeEventListener('pagehide', onHide);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
