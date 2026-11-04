export const POKEAPI_REST = 'https://pokeapi.co/api/v2'

/** Species slugs in National Pokédex order: ["bulbasaur", "ivysaur", …]. */
export async function fetchSpeciesNames(limit: number, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(`${POKEAPI_REST}/pokemon-species?limit=${limit}`)
  if (!response.ok) throw new Error(`PokéAPI species list: HTTP ${response.status}`)
  const body = (await response.json()) as { results: { name: string }[] }
  return body.results.map(entry => entry.name)
}
