import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flush, init, stop } from './client';
import type { ClickEvent } from './types';

const fetchMock = vi.fn<typeof fetch>();

function bodyOf(call: number): { apiKey: string; events: ClickEvent[] } {
  const args = fetchMock.mock.calls[call];
  return JSON.parse(String(args?.[1]?.body ?? '{}'));
}

// jsdom logs "Not implemented: navigation" when an anchor click runs its default
// action; the SDK doesn't care about the navigation, only the click.
document.addEventListener('click', (event) => event.preventDefault());

function click(id: string): void {
  document.getElementById(id)!.click();
}

describe('init', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<button id="cta">Buy now</button><a id="link" href="/pricing">Pricing</a>';
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 202 } as Response);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'sendBeacon');
  });

  it('refuses to start without both apiKey and apiHost', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    init({ apiKey: '', apiHost: 'http://localhost:3000' });
    click('cta');

    expect(warn).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a second init so a page only ever has one tracker', async () => {
    init({ apiKey: 'first', apiHost: 'http://localhost:3000', batchSize: 1 });
    init({ apiKey: 'second', apiHost: 'http://localhost:3000', batchSize: 1 });

    click('cta');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(bodyOf(0).apiKey).toBe('first');
  });

  it('captures a click and posts it with identity attached', async () => {
    init({ apiKey: 'obs_demo', apiHost: 'http://localhost:3000', batchSize: 1 });

    click('cta');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [event] = bodyOf(0).events;
    expect(event).toMatchObject({
      anonymousId: localStorage.getItem('obs_anon_id'),
      sessionId: localStorage.getItem('obs_session_id'),
      elementTag: 'button',
      elementId: 'cta',
      elementText: 'Buy now',
      elementSelector: '#cta',
      url: location.href,
    });
    expect(Date.parse(event!.timestamp)).not.toBeNaN();
  });

  it('captures anchors with their resolved href', async () => {
    init({ apiKey: 'obs_demo', apiHost: 'http://localhost:3000', batchSize: 1 });

    click('link');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(bodyOf(0).events[0]?.elementHref).toBe(new URL('/pricing', location.href).href);
  });

  it('batches several clicks into one request', async () => {
    init({ apiKey: 'obs_demo', apiHost: 'http://localhost:3000', batchSize: 3 });

    click('cta');
    click('cta');
    click('link');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(bodyOf(0).events).toHaveLength(3);
  });

  it('keeps one session across clicks, and rotates it after the idle timeout', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T10:00:00.000Z'));
    init({ apiKey: 'obs_demo', apiHost: 'http://localhost:3000', batchSize: 1000 });

    click('cta');
    vi.setSystemTime(new Date('2026-08-21T10:10:00.000Z')); // 10 min later
    click('cta');
    vi.setSystemTime(new Date('2026-08-21T10:45:00.000Z')); // 35 min idle
    click('cta');

    await flush();

    const sessions = bodyOf(0).events.map((e) => e.sessionId);
    expect(sessions[0]).toBe(sessions[1]);
    expect(sessions[2]).not.toBe(sessions[1]);
  });

  it('beacons whatever is buffered when the page hides', () => {
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    init({ apiKey: 'obs_demo', apiHost: 'http://localhost:3000', batchSize: 1000 });

    click('cta');
    window.dispatchEvent(new Event('pagehide'));

    expect(beacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled(); // nothing was left for the timer
  });

  it('survives a click handler that would otherwise throw', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    init({ apiKey: 'obs_demo', apiHost: 'http://localhost:3000', batchSize: 1 });

    // An element whose tagName getter explodes stands in for any DOM oddity.
    const hostile = document.createElement('button');
    Object.defineProperty(hostile, 'tagName', {
      get() {
        throw new Error('boom');
      },
    });
    document.body.appendChild(hostile);

    expect(() => hostile.click()).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});

describe('stop', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<button id="cta">Buy now</button>';
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 202 } as Response);
    vi.stubGlobal('fetch', fetchMock);
  });

  it('detaches the listeners and lets init run again', async () => {
    init({ apiKey: 'first', apiHost: 'http://localhost:3000', batchSize: 1 });
    stop();

    click('cta');
    expect(fetchMock).not.toHaveBeenCalled();

    init({ apiKey: 'second', apiHost: 'http://localhost:3000', batchSize: 1 });
    click('cta');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(bodyOf(0).apiKey).toBe('second');
    stop();
  });
});
