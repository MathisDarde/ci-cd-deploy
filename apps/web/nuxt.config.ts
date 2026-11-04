import { DEFAULT_LOCALE, LOCALES } from './i18n/locales'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/i18n'],

  // SSR: Pokémon pages are served as full HTML (SEO). `nuxt generate` prerenders
  // the same pages to static files for S3 + CloudFront (see modules/prerender-pokemon.ts).
  ssr: true,

  css: [
    '@fontsource-variable/bricolage-grotesque',
    '@fontsource-variable/figtree',
    '~/assets/css/main.css',
  ],

  // Overridden per environment with NUXT_PUBLIC_API_BASE / NUXT_PUBLIC_SITE_URL:
  // one build, one configuration per environment.
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001',
      siteUrl: 'http://localhost:3000',
      appVersion: 'dev',
    },
  },

  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    strategy: 'prefix_except_default',
    locales: LOCALES.map(({ code, language, name, file }) => ({ code, language, name, file })),
    // Absolute URLs for canonical and hreflang links: NUXT_PUBLIC_I18N_BASE_URL.
    baseUrl: 'http://localhost:3000',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
  },

  app: {
    head: {
      link: [{ rel: 'icon', href: '/favicon.ico' }],
      meta: [{ name: 'theme-color', content: '#13151d' }],
    },
  },

  nitro: {
    prerender: {
      concurrency: 8,
      failOnError: true,
    },
  },

  typescript: {
    strict: true,
  },
})
