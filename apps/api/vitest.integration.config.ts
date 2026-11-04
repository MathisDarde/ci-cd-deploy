import { defineConfig } from 'vitest/config'

// Integration tests against a real, isolated PostgreSQL database (no SQL mock).
// TEST_DATABASE_URL must point to a throwaway database: tables are truncated.
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    // One database shared by every file: run them one after the other.
    fileParallelism: false,
    globalSetup: ['test/integration/global-setup.ts'],
  },
})
