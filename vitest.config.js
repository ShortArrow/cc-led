import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 1000,   // Short timeout for fast tests
    hookTimeout: 2000,   // Timeout for setup/teardown hooks
    maxConcurrency: 3,   // Limit concurrent tests to prevent resource conflicts
    pool: 'forks',       // Use fork pool for better isolation
    isolate: true,       // Ensure test isolation
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
    testMatch: ['test/**/*.test.js'],
    // Optimize for faster execution
    sequence: {
      concurrent: true
    },
    // Add reporters for better feedback
    reporters: process.env.CI ? ['basic'] : ['verbose']
  }
});