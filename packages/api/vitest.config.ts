import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', passWithNoTests: true },
  optimizeDeps: {
    include: [],
    exclude: ['node:sqlite', 'sqlite'],
  },
  ssr: {
    noExternal: true,
    external: ['node:sqlite'],
  },
});
