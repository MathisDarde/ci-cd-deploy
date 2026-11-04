export interface PokemonStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

/** A Pokémon profile as displayed on /pokemon/[name]. */
export interface Pokemon {
  id: number
  /** PokéAPI slug, e.g. "pikachu". */
  name: string
  /** Name in the requested language. */
  displayName: string
  genus: string | null
  description: string | null
  types: string[]
  /** Metres */
  height: number
  /** Kilograms */
  weight: number
  stats: PokemonStats
  abilities: string[]
  artwork: string
}
