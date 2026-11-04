import { defineNuxtModule, useLogger } from 'nuxt/kit'
import { LOCALES, localePrefix } from '../i18n/locales'
import { fetchSpeciesNames } from '../shared/species'

/**
 * SSG: on `nuxt generate`, fetches Pokémon names from PokéAPI and injects one
 * /pokemon/[name] route per Pokémon and per language into the prerenderer.
 *
 * PRERENDER_POKEMON_LIMIT (default 151, the first generation) bounds the build time.
 * PRERENDER_POKEMON=true also enables it on `nuxt build`.
 */
export default defineNuxtModule({
  meta: { name: 'prerender-pokemon' },
  setup(_options, nuxt) {
    // `nuxt generate` sets nitro.static.
    const generating = nuxt.options.nitro.static || process.env.PRERENDER_POKEMON === 'true'
    if (!generating) return

    const logger = useLogger('prerender-pokemon')
    const limit = Number(process.env.PRERENDER_POKEMON_LIMIT ?? 151)

    nuxt.hook('prerender:routes', async ({ routes }) => {
      const names = await fetchSpeciesNames(limit)
      for (const { code } of LOCALES) {
        const prefix = localePrefix(code)
        routes.add(prefix || '/')
        routes.add(`${prefix}/wishlist`)
        for (const name of names) routes.add(`${prefix}/pokemon/${name}`)
      }
      routes.add('/sitemap.xml')
      logger.info(`Prerendering ${names.length} Pokémon × ${LOCALES.length} languages`)
    })
  },
})
