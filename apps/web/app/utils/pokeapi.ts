import type { Pokemon } from '@pokewishlist/shared'
import { POKEAPI_REST } from '#shared/species'
import { artworkUrl } from './display'

export { POKEAPI_REST }

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface NamedResource {
  name: string
}
interface Localized {
  language: NamedResource
}

interface SpeciesResponse {
  id: number
  name: string
  names: (Localized & { name: string })[]
  genera: (Localized & { genus: string })[]
  flavor_text_entries: (Localized & { flavor_text: string })[]
}

interface PokemonResponse {
  height: number
  weight: number
  types: { slot: number; type: NamedResource }[]
  stats: { base_stat: number; stat: NamedResource }[]
  abilities: { ability: NamedResource; is_hidden: boolean }[]
  sprites: { other?: { 'official-artwork'?: { front_default: string | null } } }
}

export class PokeApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'PokeApiError'
  }
}

/** GET a PokéAPI resource: the JSON body, null on 404, PokeApiError otherwise. */
async function getJson<T>(path: string): Promise<T | null> {
  let response: Response
  try {
    response = await fetch(`${POKEAPI_REST}/${path}`, { headers: { Accept: 'application/json' } })
  } catch (cause) {
    throw new PokeApiError(`PokéAPI unreachable: ${(cause as Error).message}`)
  }
  if (response.status === 404) return null
  if (!response.ok)
    throw new PokeApiError(`PokéAPI ${path}: HTTP ${response.status}`, response.status)
  return (await response.json()) as T
}

function pick<T extends Localized>(entries: T[], locale: string): T | undefined {
  return (
    entries.find(e => e.language.name === locale) ?? entries.find(e => e.language.name === 'en')
  )
}

const humanize = (slug: string) =>
  slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * A Pokémon profile from the PokéAPI REST endpoints, texts in `locale` (English fallback).
 * @returns null when the Pokémon does not exist (HTTP 404 or an impossible name)
 */
export async function fetchPokemon(name: string, locale: string): Promise<Pokemon | null> {
  const slug = name.trim().toLowerCase()
  if (!SLUG.test(slug)) return null

  const species = await getJson<SpeciesResponse>(`pokemon-species/${slug}`)
  if (!species) return null
  // The species id is the default variety's id (deoxys → deoxys-normal).
  const pokemon = await getJson<PokemonResponse>(`pokemon/${species.id}`)
  if (!pokemon) return null

  const stat = (key: string) => pokemon.stats.find(s => s.stat.name === key)?.base_stat ?? 0
  const description = pick(species.flavor_text_entries, locale)?.flavor_text

  return {
    id: species.id,
    name: species.name,
    displayName: pick(species.names, locale)?.name ?? humanize(species.name),
    genus: pick(species.genera, locale)?.genus ?? null,
    // Flavor texts keep the line breaks and form feeds of the game screens.
    description: description ? description.replace(/\s+/g, ' ').trim() : null,
    types: [...pokemon.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name),
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    stats: {
      hp: stat('hp'),
      attack: stat('attack'),
      defense: stat('defense'),
      specialAttack: stat('special-attack'),
      specialDefense: stat('special-defense'),
      speed: stat('speed'),
    },
    abilities: pokemon.abilities.map(a => humanize(a.ability.name)),
    artwork: pokemon.sprites.other?.['official-artwork']?.front_default ?? artworkUrl(species.id),
  }
}
