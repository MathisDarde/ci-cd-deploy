import { defineConfig, devices } from '@playwright/test'

// E2E: real browser → Nuxt (built, SSR) → Hono API (→ PostgreSQL when DATABASE_URL is set).
// Build first: `pnpm build`, then `pnpm test:e2e`.
const API_PORT = Number(process.env.API_PORT ?? 3001)
const WEB_PORT = Number(process.env.WEB_PORT ?? 3100)
const API_URL = process.env.E2E_API_URL ?? `http://localhost:${API_PORT}`
const WEB_URL = process.env.E2E_BASE_URL ?? `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: './e2e',
  // Every test shares the same wishlist (one API): run them one by one.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@visual|@mobile/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      grep: /@mobile/,
    },
    {
      // Visual regression: baselines are OS-specific, generate them on Linux (CI).
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      grep: /@visual/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'node apps/api/dist/server.mjs',
          url: `${API_URL}/health`,
          env: {
            PORT: String(API_PORT),
            APP_ENV: 'test',
            APP_VERSION: 'e2e',
            // Set in CI: the E2E suite then goes all the way to PostgreSQL.
            DATABASE_URL: process.env.DATABASE_URL ?? '',
          },
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: 'node apps/web/.output/server/index.mjs',
          url: WEB_URL,
          env: {
            PORT: String(WEB_PORT),
            NUXT_PUBLIC_API_BASE: API_URL,
            NUXT_PUBLIC_SITE_URL: WEB_URL,
            NUXT_PUBLIC_I18N_BASE_URL: WEB_URL,
          },
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
})
