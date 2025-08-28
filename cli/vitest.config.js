import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,  // Increase timeout for Arduino CLI operations
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        '*.config.js',
        'src/cli.js'
      ]
    },
    testMatch: ['test/**/*.test.js']
  }
});