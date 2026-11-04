import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import {
  MAX_SELECTED_TYPES,
  SORT_OPTIONS,
  type CatalogFilters,
  type SortKey,
} from '~/utils/catalog'
import { POKEMON_TYPES, RARITIES } from '~/utils/display'

const URL_WRITE_DELAY_MS = 200

function first(value: LocationQuery[string] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

function parseQuery(query: LocationQuery): CatalogFilters {
  const sort = first(query.sort)
  const rarity = first(query.rarity)
  const generation = Number.parseInt(first(query.gen), 10)
  return {
    q: first(query.q),
    types: first(query.types)
      .split(',')
      .filter(type => type in POKEMON_TYPES)
      .slice(0, MAX_SELECTED_TYPES),
    generation: generation > 0 ? generation : null,
    rarity: (RARITIES as readonly string[]).includes(rarity)
      ? (rarity as CatalogFilters['rarity'])
      : null,
    sort: sort in SORT_OPTIONS ? (sort as SortKey) : 'id',
    dir: first(query.dir) === 'desc' ? 'desc' : 'asc',
  }
}

function toQuery(filters: CatalogFilters): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  if (filters.q) query.q = filters.q
  if (filters.types.length) query.types = filters.types.join(',')
  if (filters.generation) query.gen = String(filters.generation)
  if (filters.rarity) query.rarity = filters.rarity
  if (filters.sort !== 'id') query.sort = filters.sort
  if (filters.dir !== 'asc') query.dir = filters.dir
  return query
}

/** Filter state mirrored in the URL, so views can be shared and survive "back". */
export function useCatalogFilters() {
  const route = useRoute()
  const router = useRouter()
  const path = route.path
  const filters = reactive(parseQuery(route.query))

  let timer: ReturnType<typeof setTimeout> | undefined
  let writePending = false

  watch(filters, () => {
    clearTimeout(timer)
    writePending = true
    timer = setTimeout(async () => {
      await router.replace({ path, query: toQuery(filters) })
      writePending = false
    }, URL_WRITE_DELAY_MS)
  })

  // External changes only (nav link, back button): our own writes would otherwise
  // overwrite whatever the user typed while they were being applied.
  watch(
    () => route.query,
    query => {
      if (route.path === path && !writePending) Object.assign(filters, parseQuery(query))
    },
  )

  onBeforeUnmount(() => clearTimeout(timer))

  const hasActiveFilters = computed(() =>
    Boolean(filters.q || filters.types.length || filters.generation || filters.rarity),
  )

  function resetFilters() {
    Object.assign(filters, { q: '', types: [], generation: null, rarity: null })
  }

  return { filters, hasActiveFilters, resetFilters }
}
