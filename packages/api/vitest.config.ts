import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Prevent vite from processing node: modules
      'node:sqlite': 'node:sqlite',
      'node:': 'node:',
    },
  },
  test: { environment: 'node', passWithNoTests: true },
});
