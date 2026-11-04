// Pre-commit (< 30 s): format, lint and unit tests of the changed files only.
const quote = files => files.map(file => JSON.stringify(file)).join(' ')

export default {
  '*.{js,mjs,ts,vue,json,md,yml,yaml,css}': files => `prettier --write ${quote(files)}`,
  'apps/web/**/*.{ts,vue}': files =>
    `pnpm --filter @pokewishlist/web exec eslint --max-warnings=0 ${quote(files)}`,
  '{apps/api,packages,scripts,e2e}/**/*.{ts,mjs}': files =>
    `eslint --max-warnings=0 ${quote(files)}`,
  // Only the tests related to the staged files, in every package.
  '{apps,packages}/**/*.{ts,vue}': files =>
    `pnpm -r exec vitest related --run --passWithNoTests ${quote(files)}`,
}
