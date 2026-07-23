import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'Observe', // IIFE build attaches to window.Observe
  dts: true,
  minify: true,
  sourcemap: true,
  target: 'es2018',
  clean: true,
});
