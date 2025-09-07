import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run Phase 12 tests sequentially to avoid process.cwd() mock conflicts
    fileParallelism: false,
    maxConcurrency: 1,
    include: ['test/phase12/**/*.test.js']
  }
})