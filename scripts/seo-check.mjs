// SEO check without JavaScript: fetch the raw HTTP HTML, like a crawler that does not
// run JS, and make sure Pokémon pages are not empty shells.
//
//   node scripts/seo-check.mjs http://localhost:3000 https://dxxxx.cloudfront.net
//
// Compares every base URL (SSR, SSG, …) on the same pages.

import { vercelBypassHeaders } from './vercel-bypass.mjs'

const bases = process.argv.slice(2).map(url => url.replace(/\/$/, ''))
if (!bases.length) {
  console.error('Usage: node scripts/seo-check.mjs <base-url> [<base-url>…]')
  process.exit(1)
}

const PAGES = [
  { path: '/pokemon/pikachu', name: 'Pikachu' },
  { path: '/pokemon/bulbasaur', name: 'Bulbasaur' },
  { path: '/fr/pokemon/bulbasaur', name: 'Bulbizarre' },
  { path: '/de/pokemon/charmander', name: 'Glumanda' },
]

const textContent = html =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const attr = (html, pattern) => html.match(pattern)?.[1]?.trim() ?? ''

function audit(html, name) {
  const title = attr(html, /<title[^>]*>([^<]*)<\/title>/i)
  const h1 = attr(html, /<h1[^>]*>([^<]*)<\/h1>/i)
  const description = attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)
  const ogImage = attr(html, /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i)
  const hreflangs = (html.match(/hreflang="/g) ?? []).length
  const words = textContent(html).split(' ').length

  const problems = []
  if (!title.includes(name)) problems.push(`<title> "${title}" lacks "${name}"`)
  if (h1 !== name) problems.push(`<h1> "${h1}" instead of "${name}"`)
  if (description.length < 30) problems.push('meta description missing or too short')
  if (!canonical) problems.push('no canonical link')
  if (!ogImage) problems.push('no og:image')
  if (hreflangs < 4) problems.push(`only ${hreflangs} hreflang alternates`)
  // An SPA shell has a few words at most: the content arrives with JS.
  if (words < 60) problems.push(`only ${words} words of text: empty shell?`)
  // A missing translation shows its key ("app.name") instead of the text.
  const rawKeys = `${title} ${textContent(html)}`.match(
    /\b(?:app|home|catalog|pokemon|wishlist|stats|error)\.[a-zA-Z]+\b/g,
  )
  if (rawKeys) problems.push(`untranslated i18n keys: ${[...new Set(rawKeys)].join(', ')}`)
  return { problems, summary: `${words} words, title "${title}"` }
}

let failed = 0
for (const page of PAGES) {
  for (const base of bases) {
    const url = `${base}${page.path}`
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'pokewishlist-seo-check', ...vercelBypassHeaders(url) },
      })
      const html = await response.text()
      const { problems, summary } = audit(html, page.name)
      if (response.status !== 200) problems.unshift(`HTTP ${response.status}`)
      if (problems.length) {
        failed++
        console.error(`✗ ${url}\n    ${problems.join('\n    ')}`)
      } else {
        console.warn(`✓ ${url} — ${summary}`)
      }
    } catch (error) {
      failed++
      console.error(`✗ ${url} — ${error.message}`)
    }
  }
}

process.exit(failed ? 1 : 0)
