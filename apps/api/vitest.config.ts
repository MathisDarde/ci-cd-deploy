import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/integration/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // Entry points and PostgreSQL code are covered by the integration (test:integration) and E2E suites.
      exclude: [
        'src/server.ts',
        'src/lambda.ts',
        'src/migrate-cli.ts',
        'src/migrate.ts',
        'src/postgres.ts',
        'src/locales/**',
      ],
      reporter: ['text', 'json-summary', 'json', 'html'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
})
