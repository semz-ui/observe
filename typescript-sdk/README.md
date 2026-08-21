# @observe/sdk

The browser tracker for **observe** — drop it on a page and every click is
captured, batched, and posted to the ingestion API.

Not published to npm yet (Phase 10); today it is built locally and loaded from
`dist/`.

## Usage

Script tag (the IIFE build attaches `window.Observe`):

```html
<script src="/path/to/observe.global.js"></script>
<script>
  Observe.init({ apiKey: 'obs_…', apiHost: 'https://api.example.com' });
</script>
```

Bundler (ESM/CJS both ship):

```ts
import { init } from '@observe/sdk';

init({ apiKey: 'obs_…', apiHost: 'https://api.example.com' });
```

The API key is a **public** project key: it only grants ingestion, never reads.

### Options

| Option          | Default | Meaning                                            |
| --------------- | ------- | -------------------------------------------------- |
| `apiKey`        | —       | Project key (`obs_<random>`), required             |
| `apiHost`       | —       | Base URL of the observe API, required              |
| `flushInterval` | `5000`  | Max ms a buffered event waits before being sent    |
| `batchSize`     | `20`    | Flush as soon as this many events are queued       |
| `sessionTimeout`| `1800000` | Idle ms after which a new session id is minted   |

Anything non-numeric, zero, or negative falls back to the default.

### Other exports

- `flush(): Promise<void>` — send what's buffered now.
- `stop(): void` — detach listeners, beacon the tail, reset. `init()` can run
  again afterwards (SPA teardown, tests).

## What gets captured

A capture-phase `click` listener on `document` — capture phase so a page calling
`stopPropagation()` can't hide clicks. The click is attributed to the nearest
enclosing control (`a`, `button`, `input`, `[role="button"]`, …), so clicking the
`<span>` inside a button records the button.

Each event carries: page URL and title, element tag/id/text (whitespace
collapsed), a CSS selector, `href` for links, an ISO timestamp, plus the
anonymous and session ids. Every string is truncated to the server's
`@MaxLength` cap, so a 400 can never be the SDK's fault.

Selectors are built by climbing up to 5 ancestors, stopping at the first id, and
adding `:nth-of-type(n)` only when siblings share a tag — e.g. `#menu >
li:nth-of-type(2)`. They're labels for grouping, not queries.

## Identity

- **anonymousId** — minted once, kept in `localStorage` (`obs_anon_id`).
- **sessionId** — refreshed on every click; a new one is minted after
  `sessionTimeout` of inactivity. Stored in `localStorage`, so tabs share it.

Ids come from `crypto.randomUUID`, falling back to `getRandomValues` and finally
`Math.random` — analytics ids need uniqueness, not unpredictability. When
`localStorage` is unavailable (private mode, disabled storage, exhausted quota)
everything degrades to an in-memory store instead of throwing.

## Delivery

Events buffer in memory and flush when the queue hits `batchSize`, when
`flushInterval` elapses, or when the page hides (`pagehide` /
`visibilitychange`), where `navigator.sendBeacon` takes over — with a
`keepalive` fetch as backup.

Failure policy: a batch the server *couldn't* take (offline, 5xx) goes back to
the front of the queue and the timer retries it; a batch it *won't* take (4xx —
bad key, invalid payload) is dropped, because retrying can only fail again. The
buffer is capped at 500 events and requests at 100 (the server's
`@ArrayMaxSize`), dropping the oldest first.

Nothing the SDK does is allowed to break the host page: bad config, a hostile
DOM, or a failed request degrade to a `console.warn`.

## Development

```bash
pnpm install
pnpm build       # tsup → ESM + CJS + IIFE (+ .d.ts) in dist/
pnpm test        # vitest + jsdom
pnpm typecheck   # tsc --noEmit

pnpm demo        # build, then serve the demo at http://localhost:4173/examples/demo-site/
```

The demo page needs a real project key pasted into its `init()` call and the API
running on `http://localhost:3000`; clicking around it should land rows in
Postgres.
