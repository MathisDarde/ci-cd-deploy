// Prints the Vitest coverage of every package as a Markdown table (GitHub step summary),
// and with --badges <dir>, writes shields.io endpoint files for the README badges.
//
//   node scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
//   node scripts/coverage-summary.mjs --badges site/badges
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGES = {
  shared: 'packages/shared',
  api: 'apps/api',
  web: 'apps/web',
}

// stdout is the Markdown output (console.log is banned by the lint rules).
const print = line => process.stdout.write(`${line}\n`)

const rows = []
let covered = 0
let total = 0

for (const [name, dir] of Object.entries(PACKAGES)) {
  const file = join(dir, 'coverage', 'coverage-summary.json')
  if (!existsSync(file)) continue
  const { total: t } = JSON.parse(readFileSync(file, 'utf8'))
  rows.push({
    name,
    lines: t.lines.pct,
    statements: t.statements.pct,
    functions: t.functions.pct,
    branches: t.branches.pct,
  })
  covered += t.lines.covered
  total += t.lines.total
}

const overall = total ? Math.round((covered / total) * 1000) / 10 : 0

print('## Test coverage\n')
print('| Package | Lines | Statements | Functions | Branches |')
print('| --- | ---: | ---: | ---: | ---: |')
for (const r of rows) {
  print(`| ${r.name} | ${r.lines}% | ${r.statements}% | ${r.functions}% | ${r.branches}% |`)
}
print(`| **all** | **${overall}%** | | | |`)

const badgesIndex = process.argv.indexOf('--badges')
if (badgesIndex !== -1) {
  const out = process.argv[badgesIndex + 1] ?? 'badges'
  mkdirSync(out, { recursive: true })
  const color = pct =>
    pct >= 90 ? 'brightgreen' : pct >= 80 ? 'green' : pct >= 70 ? 'yellow' : 'red'
  const badge = (label, pct) => ({ schemaVersion: 1, label, message: `${pct}%`, color: color(pct) })
  writeFileSync(join(out, 'coverage.json'), JSON.stringify(badge('coverage', overall)))
  for (const r of rows) {
    writeFileSync(
      join(out, `coverage-${r.name}.json`),
      JSON.stringify(badge(`coverage ${r.name}`, r.lines)),
    )
  }
}
