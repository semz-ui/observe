import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The SDK is browser code: DOM, localStorage, listeners.
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
