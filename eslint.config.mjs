// @ts-check
// Lint for everything except the Nuxt app (apps/web has its own @nuxt/eslint config).
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.output/**',
      '**/.nuxt/**',
      'apps/web/**',
      'playwright-report/**',
      'test-results/**',
      'reports/**',
      'infra/**/.terraform/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // No debug output left in the code: console.warn / console.error stay allowed.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // k6 scripts run in k6's own JS runtime.
    files: ['tests/load/**'],
    languageOptions: { globals: { __ENV: 'readonly' } },
  },
)
