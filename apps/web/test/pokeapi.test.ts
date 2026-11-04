import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPokemon, PokeApiError } from '../app/utils/pokeapi'
import { fetchSpeciesNames } from '../shared/species'

// fetch is mocked: these tests pass without any connection to PokéAPI.
const fetchMock = vi.fn<typeof fetch>()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const species = {
  id: 25,
  name: 'pikachu',
  names: [
    { name: 'Pikachu', language: { name: 'en' } },
    { name: 'Pikachu', language: { name: 'fr' } },
  ],
  genera: [
    { genus: 'Mouse Pokémon', language: { name: 'en' } },
    { genus: 'Pokémon Souris', language: { name: 'fr' } },
  ],
  flavor_text_entries: [
    { flavor_text: 'When several of\nthese POKéMON\fgather…', language: { name: 'en' } },
  ],
}

const pokemon = {
  height: 4,
  weight: 60,
  types: [{ slot: 1, type: { name: 'electric' } }],
  stats: [
    { base_stat: 35, stat: { name: 'hp' } },
    { base_stat: 55, stat: { name: 'attack' } },
    { base_stat: 40, stat: { name: 'defense' } },
    { base_stat: 50, stat: { name: 'special-attack' } },
    { base_stat: 50, stat: { name: 'special-defense' } },
    { base_stat: 90, stat: { name: 'speed' } },
  ],
  abilities: [
    { ability: { name: 'static' }, is_hidden: false },
    { ability: { name: 'lightning-rod' }, is_hidden: true },
  ],
  sprites: { other: { 'official-artwork': { front_default: 'https://img/25.png' } } },
}

function respondWith(routes: Record<string, () => Response>) {
  fetchMock.mockImplementation(async input => {
    const url = String(input)
    const match = Object.keys(routes).find(path => url.endsWith(path))
    return match ? routes[match]!() : json({}, 404)
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('fetchPokemon', () => {
  it('maps a 200 response to a Pokémon', async () => {
    respondWith({
      '/pokemon-species/pikachu': () => json(species),
      '/pokemon/25': () => json(pokemon),
    })

    expect(await fetchPokemon('pikachu', 'en')).toEqual({
      id: 25,
      name: 'pikachu',
      displayName: 'Pikachu',
      genus: 'Mouse Pokémon',
      description: 'When several of these POKéMON gather…',
      types: ['electric'],
      height: 0.4,
      weight: 6,
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
      abilities: ['Static', 'Lightning Rod'],
      artwork: 'https://img/25.png',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon-species/pikachu',
      expect.anything(),
    )
  })

  it('uses the requested language, with an English fallback', async () => {
    respondWith({
      '/pokemon-species/pikachu': () => json(species),
      '/pokemon/25': () => json(pokemon),
    })
    const result = await fetchPokemon('pikachu', 'fr')
    expect(result?.genus).toBe('Pokémon Souris')
    // No French flavor text in the fixture: English one.
    expect(result?.description).toBe('When several of these POKéMON gather…')
  })

  it('returns null for an unknown Pokémon (404)', async () => {
    respondWith({ '/pokemon-species/missingno': () => json({ detail: 'Not found' }, 404) })
    expect(await fetchPokemon('missingno', 'en')).toBeNull()
  })

  it('returns null without calling the API for an impossible name', async () => {
    expect(await fetchPokemon('../admin', 'en')).toBeNull()
    expect(await fetchPokemon('', 'en')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizes the name', async () => {
    respondWith({
      '/pokemon-species/pikachu': () => json(species),
      '/pokemon/25': () => json(pokemon),
    })
    expect((await fetchPokemon(' Pikachu ', 'en'))?.id).toBe(25)
  })

  it('throws on a server error (500)', async () => {
    respondWith({ '/pokemon-species/pikachu': () => json({}, 500) })
    await expect(fetchPokemon('pikachu', 'en')).rejects.toBeInstanceOf(PokeApiError)
  })

  it('throws when PokéAPI is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    await expect(fetchPokemon('pikachu', 'en')).rejects.toThrow(/unreachable/)
  })
})

describe('fetchSpeciesNames', () => {
  it('returns the slugs in order', async () => {
    fetchMock.mockResolvedValue(json({ results: [{ name: 'bulbasaur' }, { name: 'ivysaur' }] }))
    expect(await fetchSpeciesNames(2)).toEqual(['bulbasaur', 'ivysaur'])
    expect(fetchMock).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon-species?limit=2')
  })

  it('fails loudly so a broken prerender stops the build', async () => {
    fetchMock.mockResolvedValue(json({}, 503))
    await expect(fetchSpeciesNames(2)).rejects.toThrow(/503/)
  })
})
