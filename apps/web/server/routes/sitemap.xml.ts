import { LOCALES, localePrefix, type LocaleCode } from '../../i18n/locales'
import { fetchSpeciesNames } from '#shared/species'

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, char => `&#${char.charCodeAt(0)};`)

/** Sitemap with every language variant linked through hreflang alternates. */
export default defineCachedEventHandler(
  async event => {
    const siteUrl = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')
    const url = (code: LocaleCode, path: string) =>
      escapeXml(`${siteUrl}${localePrefix(code)}${path}` + (path || localePrefix(code) ? '' : '/'))

    const names = await fetchSpeciesNames(Number(process.env.PRERENDER_POKEMON_LIMIT ?? 151))
    const paths = ['', '/wishlist', ...names.map(name => `/pokemon/${name}`)]

    const entries = paths.flatMap(path =>
      LOCALES.map(({ code }) => {
        const alternates = LOCALES.map(
          alt =>
            `<xhtml:link rel="alternate" hreflang="${alt.code}" href="${url(alt.code, path)}"/>`,
        ).join('')
        return `<url><loc>${url(code, path)}</loc>${alternates}</url>`
      }),
    )

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`
  },
  { maxAge: 60 * 60 * 24 },
)
