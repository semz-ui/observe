import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueue } from './queue';
import type { ClickEvent, ResolvedConfig } from './types';

const fetchMock = vi.fn<typeof fetch>();

function config(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    apiKey: 'obs_test_key',
    apiHost: 'http://localhost:3000',
    flushInterval: 5000,
    batchSize: 20,
    sessionTimeout: 30 * 60_000,
    ...overrides,
  };
}

function event(n: number): ClickEvent {
  return {
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    url: 'http://localhost:3000/',
    elementTag: 'button',
    elementSelector: '#cta',
    elementText: `click ${n}`,
    timestamp: new Date(1_700_000_000_000 + n).toISOString(),
  };
}

function accepted(status = 202): Response {
  return { ok: status < 400, status } as Response;
}

/** The JSON the SDK actually posted on the nth call. */
function bodyOf(call: number): { apiKey: string; events: ClickEvent[] } {
  const args = fetchMock.mock.calls[call];
  return JSON.parse(String(args?.[1]?.body ?? '{}'));
}

/** Stub sendBeacon, which jsdom doesn't implement. */
function stubBeacon(result: boolean): ReturnType<typeof vi.fn> {
  const beacon = vi.fn().mockReturnValue(result);
  Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
  return beacon;
}

describe('createQueue', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(accepted());
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'sendBeacon');
  });

  it('posts the batch to /v1/events with the api key in the body', async () => {
    const queue = createQueue(config({ batchSize: 1000 }));
    queue.enqueue(event(1));

    await queue.flush();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/v1/events');
    expect(bodyOf(0)).toEqual({ apiKey: 'obs_test_key', events: [event(1)] });
    expect(queue.size()).toBe(0);
  });

  it('flushes as soon as the queue reaches batchSize', async () => {
    const queue = createQueue(config({ batchSize: 2 }));

    queue.enqueue(event(1));
    expect(fetchMock).not.toHaveBeenCalled();

    queue.enqueue(event(2));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(bodyOf(0).events).toHaveLength(2);
  });

  it('flushes a partial batch once the interval elapses', async () => {
    vi.useFakeTimers();
    const queue = createQueue(config({ flushInterval: 1000 }));

    queue.enqueue(event(1));
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(queue.size()).toBe(0);
  });

  it('requeues a batch the server could not take, and retries on the next tick', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(accepted(503));
    const queue = createQueue(config({ batchSize: 1000, flushInterval: 1000 }));

    queue.enqueue(event(1));
    await queue.flush();

    expect(queue.size()).toBe(1); // still buffered, not lost

    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(queue.size()).toBe(0);
  });

  it('keeps the queue in order when a failed batch is put back', async () => {
    fetchMock.mockResolvedValueOnce(accepted(500));
    const queue = createQueue(config({ batchSize: 1000 }));

    queue.enqueue(event(1));
    await queue.flush(); // fails, event 1 goes back to the front
    queue.enqueue(event(2));
    await queue.flush();

    expect(bodyOf(1).events.map((e) => e.elementText)).toEqual(['click 1', 'click 2']);
  });

  it('drops a batch the server rejects with a 4xx — retrying can never help', async () => {
    fetchMock.mockResolvedValue(accepted(401));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const queue = createQueue(config({ batchSize: 1000 }));

    queue.enqueue(event(1));
    await queue.flush();

    expect(queue.size()).toBe(0);
    expect(warn).toHaveBeenCalled();
  });

  it('requeues when the network throws', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const queue = createQueue(config({ batchSize: 1000 }));

    queue.enqueue(event(1));
    await queue.flush();

    expect(queue.size()).toBe(1);
  });

  it('never sends more than 100 events in one request', async () => {
    const queue = createQueue(config({ batchSize: 1000 }));
    for (let i = 0; i < 150; i++) queue.enqueue(event(i));

    await queue.flush();

    expect(bodyOf(0).events).toHaveLength(100);
    expect(queue.size()).toBe(50);
  });

  it('caps the buffer at 500 events, dropping the oldest', async () => {
    const queue = createQueue(config({ batchSize: 1000 }));
    for (let i = 0; i < 600; i++) queue.enqueue(event(i));

    expect(queue.size()).toBe(500);

    await queue.flush();
    expect(bodyOf(0).events[0]?.elementText).toBe('click 100'); // 0–99 dropped
  });

  it('hands the buffer to sendBeacon when the page unloads', () => {
    const beacon = stubBeacon(true);
    const queue = createQueue(config({ batchSize: 1000 }));
    queue.enqueue(event(1));
    queue.enqueue(event(2));

    queue.flushOnExit();

    expect(beacon).toHaveBeenCalledOnce();
    expect(beacon.mock.calls[0]?.[0]).toBe('http://localhost:3000/v1/events');
    expect(beacon.mock.calls[0]?.[1]).toBeInstanceOf(Blob);
    expect(queue.size()).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('beacons in chunks of 100', () => {
    const beacon = stubBeacon(true);
    const queue = createQueue(config({ batchSize: 1000 }));
    for (let i = 0; i < 250; i++) queue.enqueue(event(i));

    queue.flushOnExit();

    expect(beacon).toHaveBeenCalledTimes(3);
    expect(queue.size()).toBe(0);
  });

  it('falls back to a keepalive fetch when the beacon is refused', () => {
    stubBeacon(false);
    const queue = createQueue(config({ batchSize: 1000 }));
    queue.enqueue(event(1));

    queue.flushOnExit();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.keepalive).toBe(true);
    expect(queue.size()).toBe(0);
  });

  it('accepts nothing more once stopped', async () => {
    vi.useFakeTimers();
    const queue = createQueue(config({ batchSize: 1 }));

    queue.stop();
    queue.enqueue(event(1));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(queue.size()).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
