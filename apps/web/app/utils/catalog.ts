import type { CatalogPokemon, Rarity } from './catalog-api'

export type SortDirection = 'asc' | 'desc'

/** Labels are in the locale files under `sort.<key>`. */
export const SORT_OPTIONS = {
  id: { defaultDir: 'asc', value: (p: CatalogPokemon) => p.id },
  name: { defaultDir: 'asc', value: (p: CatalogPokemon) => p.name },
  totalStats: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.totalStats },
  hp: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.stats.hp },
  attack: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.stats.attack },
  defense: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.stats.defense },
  speed: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.stats.speed },
  height: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.height },
  weight: { defaultDir: 'desc', value: (p: CatalogPokemon) => p.weight },
} as const satisfies Record<
  string,
  {
    defaultDir: SortDirection
    value: (p: CatalogPokemon) => number | string
  }
>

export type SortKey = keyof typeof SORT_OPTIONS

export interface CatalogFilters {
  q: string
  types: string[]
  generation: number | null
  rarity: Exclude<Rarity, 'common'> | null
  sort: SortKey
  dir: SortDirection
}

/** A Pokémon has at most two types, so a third selected type could never match. */
export const MAX_SELECTED_TYPES = 2

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function matchesSearch(pokemon: CatalogPokemon, query: string) {
  const numeric = query.match(/^#?(\d+)$/)?.[1]
  // "25" finds 25, 250, 251…; "025" is the printed number, so only 25.
  if (numeric) {
    return (
      String(pokemon.id).padStart(3, '0').startsWith(numeric) ||
      String(pokemon.id).startsWith(numeric)
    )
  }
  return normalize(pokemon.name).includes(query) || pokemon.slug.includes(query)
}

export function applyCatalogFilters(
  list: CatalogPokemon[],
  filters: CatalogFilters,
  locale = 'en',
): CatalogPokemon[] {
  const query = normalize(filters.q)
  const { value } = SORT_OPTIONS[filters.sort]
  const direction = filters.dir === 'asc' ? 1 : -1

  return list
    .filter(
      pokemon =>
        (!query || matchesSearch(pokemon, query)) &&
        filters.types.every(type => pokemon.types.includes(type)) &&
        (filters.generation === null || pokemon.generation === filters.generation) &&
        (filters.rarity === null || pokemon.rarity === filters.rarity),
    )
    .sort((a, b) => {
      const left = value(a)
      const right = value(b)
      const order =
        typeof left === 'string'
          ? left.localeCompare(right as string, locale)
          : left - (right as number)
      return order * direction || a.id - b.id
    })
}
