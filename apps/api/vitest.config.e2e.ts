import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    environment: 'node',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./test/e2e/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});


