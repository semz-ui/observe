/**
 * The batching queue: events go in one at a time, requests go out in batches.
 *
 * A flush happens when any of three things is true — the queue reaches
 * `batchSize`, `flushInterval` elapses since the first buffered event, or the
 * page is unloading (the beacon path).
 *
 * Failure policy: a batch the server *couldn't* take (offline, 5xx) goes back
 * to the front of the queue, oldest-first, and the interval timer retries it.
 * A batch the server *won't* take (4xx) is dropped by {@link sendBatch}. The
 * queue is capped either way — a tab left open on a dead network must not grow
 * an unbounded array.
 */

import { MAX_BATCH, sendBatch, sendBeaconBatch } from './transport';
import type { ClickEvent, ResolvedConfig } from './types';

/** Buffer ceiling. Beyond this the oldest events are dropped: on a long
 *  outage, recent clicks are worth more than stale ones. */
const MAX_QUEUE = 500;

export interface EventQueue {
  enqueue(event: ClickEvent): void;
  /** Send now; resolves once the in-flight request settles. */
  flush(): Promise<void>;
  /** Synchronous best-effort send for page teardown (beacon, no awaiting). */
  flushOnExit(): void;
  /** Stop the timer and accept no further events. */
  stop(): void;
  /** Buffered event count — exposed for tests and debugging. */
  size(): number;
}

export function createQueue(config: ResolvedConfig): EventQueue {
  let pending: ClickEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let stopped = false;

  function schedule(): void {
    if (timer !== null || stopped) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, config.flushInterval);
  }

  function cancelTimer(): void {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  /** Keep the newest MAX_QUEUE events. */
  function trim(events: ClickEvent[]): ClickEvent[] {
    return events.length > MAX_QUEUE ? events.slice(events.length - MAX_QUEUE) : events;
  }

  async function flush(): Promise<void> {
    // One request at a time: concurrent flushes would duplicate events on retry
    // and reorder them for no benefit.
    if (inFlight || stopped || pending.length === 0) return;

    inFlight = true;
    cancelTimer();

    const batch = pending.slice(0, MAX_BATCH);
    pending = pending.slice(batch.length);

    let delivered = false;
    try {
      delivered = await sendBatch(config, batch);
    } finally {
      inFlight = false;
    }

    if (!delivered) {
      pending = trim(batch.concat(pending));
      schedule(); // back off to the timer rather than hammering a dead server
      return;
    }

    if (pending.length >= config.batchSize) {
      void flush(); // more than a batch arrived while that request was open
    } else if (pending.length > 0) {
      schedule();
    }
  }

  function flushOnExit(): void {
    if (stopped) return;
    cancelTimer();

    while (pending.length > 0) {
      const batch = pending.slice(0, MAX_BATCH);
      if (!sendBeaconBatch(config, batch)) break; // refused — keep the rest buffered
      pending = pending.slice(batch.length);
    }
  }

  return {
    enqueue(event: ClickEvent): void {
      if (stopped) return;

      pending.push(event);
      pending = trim(pending);

      if (pending.length >= config.batchSize) void flush();
      else schedule();
    },
    flush,
    flushOnExit,
    stop(): void {
      stopped = true;
      cancelTimer();
    },
    size: () => pending.length,
  };
}
