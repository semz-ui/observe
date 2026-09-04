import { defineConfig } from 'vitest/config';

export default defineConfig({
  // `server-only` resolves to a file that is nothing but a `throw` under every
  // export condition except `react-server`. These tests exercise server code, so
  // resolving them the way the server runtime does is honest — and it keeps the
  // guard in place for every other consumer. It has to go under `ssr`: vitest
  // runs node tests through Vite's SSR pipeline, so plain `resolve.conditions`
  // is read but never consulted for these modules.
  ssr: { resolve: { conditions: ['react-server'] } },
  test: {
    // No jsdom here — shared/api is server code with no DOM. M6 adds it for
    // component tests.
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    // vitest does not load .env.local into process.env, so every test that
    // reaches the API layer stubs OBSERVE_API_URL itself.
    unstubEnvs: true,
  },
});
