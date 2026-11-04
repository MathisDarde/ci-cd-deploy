import { LOCALES, type LocaleCode } from '~~/i18n/locales'
import { fetchCatalog, type CatalogPokemon } from '~/utils/catalog-api'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const cacheKey = (locale: string) => `pokewishlist:catalog:v2:${locale}`

interface CacheEntry {
  savedAt: number
  pokemon: CatalogPokemon[]
}

function readCache(locale: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(locale))
    return raw ? (JSON.parse(raw) as CacheEntry) : null
  } catch {
    return null
  }
}

function writeCache(locale: string, pokemon: CatalogPokemon[]) {
  try {
    const entry: CacheEntry = { savedAt: Date.now(), pokemon }
    localStorage.setItem(cacheKey(locale), JSON.stringify(entry))
  } catch {
    // Storage full or unavailable: the catalog simply gets fetched again next visit.
  }
}

// The catalog is only used client-side (<ClientOnly>): module state is never shared
// between server requests.
const pokemon = shallowRef<CatalogPokemon[]>([])
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
let loadedLocale: string | null = null
let pending: Promise<void> | null = null

async function load(locale: LocaleCode) {
  const languageId = LOCALES.find(l => l.code === locale)?.pokeApiLanguageId ?? 9
  const cached = readCache(locale)
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
    pokemon.value = cached.pokemon
    status.value = 'ready'
    loadedLocale = locale
    return
  }

  status.value = 'loading'
  try {
    const fresh = await fetchCatalog(languageId)
    pokemon.value = fresh
    writeCache(locale, fresh)
    status.value = 'ready'
    loadedLocale = locale
  } catch (error) {
    console.error('Catalog loading failed', error)
    // An expired copy is still better than an empty catalog.
    if (cached) {
      pokemon.value = cached.pokemon
      status.value = 'ready'
      loadedLocale = locale
    } else {
      status.value = 'error'
    }
  }
}

function ensureLoaded(locale: LocaleCode) {
  if (status.value === 'ready' && loadedLocale === locale) return Promise.resolve()
  pending ??= load(locale).finally(() => {
    pending = null
  })
  return pending
}

export function useCatalog() {
  const { locale } = useI18n()
  if (import.meta.client) {
    // Names are localized: switching language reloads the catalog (cached per language).
    watch(
      locale,
      code => {
        if (status.value !== 'error') void ensureLoaded(code as LocaleCode)
      },
      { immediate: true },
    )
  }
  return { pokemon, status, retry: () => ensureLoaded(locale.value as LocaleCode) }
}
