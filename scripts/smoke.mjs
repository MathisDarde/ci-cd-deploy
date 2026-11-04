// Smoke tests run right after a deployment (< 1 min): is the deployed app actually up?
// Any failing URL exits with code 1, which fails the CD job (and triggers the rollback).
//
//   API_URL=https://xxx.execute-api.eu-west-3.amazonaws.com \
//   SSR_URL=https://pokewishlist.vercel.app \
//   SSG_URL=https://dxxxx.cloudfront.net \
//   node scripts/smoke.mjs
//
// Each URL is optional: only the configured targets are checked.

const TIMEOUT_MS = 10_000
const ATTEMPTS = Number(process.env.SMOKE_ATTEMPTS ?? 5)
const RETRY_DELAY_MS = Number(process.env.SMOKE_RETRY_DELAY_MS ?? 5_000)

const trim = url => url?.replace(/\/$/, '')
const API_URL = trim(process.env.API_URL)
const SSR_URL = trim(process.env.SSR_URL)
const SSG_URL = trim(process.env.SSG_URL)

const checks = []

if (API_URL) {
  checks.push(
    {
      name: 'API /health',
      url: `${API_URL}/health`,
      status: 200,
      verify: body => JSON.parse(body).status === 'ok',
    },
    {
      name: 'API /wishlist',
      url: `${API_URL}/wishlist`,
      status: 200,
      verify: body => Array.isArray(JSON.parse(body).items),
    },
    { name: 'API unknown route', url: `${API_URL}/does-not-exist`, status: 404 },
  )
}

for (const [label, base] of [
  ['SSR', SSR_URL],
  ['SSG', SSG_URL],
]) {
  if (!base) continue
  checks.push(
    {
      name: `${label} home`,
      url: `${base}/`,
      status: 200,
      verify: b => b.includes('PokéWishlist'),
    },
    {
      name: `${label} Pokémon page`,
      url: `${base}/pokemon/pikachu`,
      status: 200,
      verify: b => /<h1[^>]*>\s*Pikachu\s*<\/h1>/.test(b),
    },
    {
      name: `${label} French Pokémon page`,
      url: `${base}/fr/pokemon/bulbasaur`,
      status: 200,
      verify: b => b.includes('Bulbizarre'),
    },
  )
}
if (SSR_URL) {
  checks.push({ name: 'SSR unknown Pokémon', url: `${SSR_URL}/pokemon/not-a-pokemon`, status: 404 })
}

if (!checks.length) {
  console.error('Nothing to check: set API_URL, SSR_URL and/or SSG_URL')
  process.exit(1)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function run(check) {
  let lastError = ''
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const started = Date.now()
    try {
      const response = await fetch(check.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'pokewishlist-smoke-test' },
      })
      const body = await response.text()
      const duration = Date.now() - started
      if (response.status !== check.status) {
        lastError = `HTTP ${response.status}, expected ${check.status}`
      } else if (check.verify && !check.verify(body)) {
        lastError = 'unexpected content'
      } else {
        return { ok: true, detail: `${response.status} in ${duration} ms` }
      }
    } catch (error) {
      lastError = error.message
    }
    // Retry: a fresh deployment can take a few seconds to propagate.
    if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS)
  }
  return { ok: false, detail: lastError }
}

let failed = 0
for (const check of checks) {
  const result = await run(check)
  if (!result.ok) failed++
  const line = `${result.ok ? '✓' : '✗'} ${check.name.padEnd(26)} ${check.url} — ${result.detail}`
  if (result.ok) console.warn(line)
  else console.error(line)
}

console.warn(`\n${checks.length - failed}/${checks.length} checks passed`)
process.exit(failed ? 1 : 0)
