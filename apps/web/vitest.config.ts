import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests of the framework-free code (utils): no Nuxt runtime, no network.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/utils/**', 'shared/**'],
      // GraphQL catalog: exercised by the E2E suite against PokéAPI.
      exclude: ['app/utils/catalog-api.ts'],
      reporter: ['text', 'json-summary', 'json', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
})
