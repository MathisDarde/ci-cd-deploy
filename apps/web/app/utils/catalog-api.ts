import type { PokemonStats } from '@pokewishlist/shared'

const GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2'

export type Rarity = 'common' | 'legendary' | 'mythical'

/** A catalog entry: everything needed to search, filter, sort and draw a card. */
export interface CatalogPokemon {
  id: number
  /** Name in the requested language. */
  name: string
  /** PokéAPI slug, used in URLs: /pokemon/pikachu */
  slug: string
  generation: number
  rarity: Rarity
  types: string[]
  /** Metres */
  height: number
  /** Kilograms */
  weight: number
  stats: PokemonStats
  totalStats: number
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await $fetch<{ data?: T; errors?: { message: string }[] }>(GRAPHQL_URL, {
    method: 'POST',
    body: { query, variables },
  })
  // GraphQL reports query failures with an HTTP 200.
  if (response.errors?.length || !response.data) {
    throw new Error(response.errors?.[0]?.message ?? 'Empty PokéAPI response')
  }
  return response.data
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const CATALOG_QUERY = `
query Catalog($lang: Int!) {
  pokemonspecies(order_by: { id: asc }) {
    id
    name
    generation_id
    is_legendary
    is_mythical
    pokemonspeciesnames(where: { language_id: { _eq: $lang } }) { name }
    pokemons(where: { is_default: { _eq: true } }) {
      height
      weight
      pokemontypes(order_by: { slot: asc }) { type { name } }
      pokemonstats { base_stat stat { name } }
    }
  }
}`

interface CatalogResponse {
  pokemonspecies: {
    id: number
    name: string
    generation_id: number
    is_legendary: boolean
    is_mythical: boolean
    pokemonspeciesnames: { name: string }[]
    pokemons: {
      height: number
      weight: number
      pokemontypes: { type: { name: string } }[]
      pokemonstats: { base_stat: number; stat: { name: string } }[]
    }[]
  }[]
}

/** The whole Pokédex in one GraphQL request, names in the given PokéAPI language. */
export async function fetchCatalog(languageId: number): Promise<CatalogPokemon[]> {
  const data = await graphql<CatalogResponse>(CATALOG_QUERY, { lang: languageId })
  return data.pokemonspecies.flatMap(species => {
    const form = species.pokemons[0]
    if (!form) return []

    const stat = (name: string) => form.pokemonstats.find(s => s.stat.name === name)?.base_stat ?? 0
    const stats: PokemonStats = {
      hp: stat('hp'),
      attack: stat('attack'),
      defense: stat('defense'),
      specialAttack: stat('special-attack'),
      specialDefense: stat('special-defense'),
      speed: stat('speed'),
    }
    const pokemon: CatalogPokemon = {
      id: species.id,
      name: species.pokemonspeciesnames[0]?.name ?? capitalize(species.name),
      slug: species.name,
      generation: species.generation_id,
      rarity: species.is_mythical ? 'mythical' : species.is_legendary ? 'legendary' : 'common',
      types: form.pokemontypes.map(t => t.type.name),
      height: form.height / 10,
      weight: form.weight / 10,
      stats,
      totalStats: Object.values(stats).reduce((sum, value) => sum + value, 0),
    }
    return [pokemon]
  })
}
