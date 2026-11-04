// Home-made CI check: every locale file must have exactly the keys of en.json.
// A missing or extra key fails the step (exit code 1), so the PR is blocked.
//
//   node scripts/check-i18n.mjs                 # front + back
//   node scripts/check-i18n.mjs path/to/locales # any other directory
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'en'
const DIRECTORIES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['apps/web/i18n/locales', 'apps/api/src/locales']

const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`],
  )

const placeholders = value => [...String(value).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

function load(dir, file) {
  try {
    return JSON.parse(readFileSync(join(dir, file), 'utf8'))
  } catch (error) {
    console.error(`✗ ${dir}/${file}: invalid JSON (${error.message})`)
    return null
  }
}

function get(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object)
}

let ko = false
for (const dir of DIRECTORIES) {
  const baseMessages = load(dir, `${BASE}.json`)
  if (!baseMessages) {
    ko = true
    continue
  }
  const base = new Set(flat(baseMessages))
  const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== `${BASE}.json`)

  for (const file of files) {
    const messages = load(dir, file)
    if (!messages) {
      ko = true
      continue
    }
    const keys = new Set(flat(messages))
    const missing = [...base].filter(x => !keys.has(x))
    const extra = [...keys].filter(x => !base.has(x))
    const empty = [...keys].filter(x => String(get(messages, x)).trim() === '')
    // "{name}" must survive the translation, or the UI shows a hole.
    const brokenPlaceholders = [...keys].filter(
      x =>
        base.has(x) &&
        placeholders(get(messages, x)).join() !== placeholders(get(baseMessages, x)).join(),
    )

    if (missing.length || extra.length || empty.length || brokenPlaceholders.length) {
      ko = true
      console.error(`✗ ${dir}/${file}`, { missing, extra, empty, brokenPlaceholders })
    } else {
      console.warn(`✓ ${dir}/${file} (${keys.size} keys)`)
    }
  }
}

process.exit(ko ? 1 : 0)
