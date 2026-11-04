/** Type colors; labels live in the locale files under `types.<name>`. */
export const POKEMON_TYPES: Record<string, { color: string; ink: string }> = {
  normal: { color: '#b5b09a', ink: '#1c1a10' },
  fire: { color: '#f4803c', ink: '#1c1a10' },
  water: { color: '#5c9cf0', ink: '#1c1a10' },
  electric: { color: '#f8d030', ink: '#1c1a10' },
  grass: { color: '#6fc35a', ink: '#1c1a10' },
  ice: { color: '#8bd8d8', ink: '#1c1a10' },
  fighting: { color: '#d4564e', ink: '#1c1a10' },
  poison: { color: '#b565c4', ink: '#1c1a10' },
  ground: { color: '#d9b45f', ink: '#1c1a10' },
  flying: { color: '#a6a4f4', ink: '#1c1a10' },
  psychic: { color: '#f7699a', ink: '#1c1a10' },
  bug: { color: '#a9bb2c', ink: '#1c1a10' },
  rock: { color: '#bba74c', ink: '#1c1a10' },
  ghost: { color: '#6a5596', ink: '#ffffff' },
  dragon: { color: '#6236e8', ink: '#ffffff' },
  dark: { color: '#5b4a3f', ink: '#ffffff' },
  steel: { color: '#b4b6cc', ink: '#1c1a10' },
  fairy: { color: '#f0a0c4', ink: '#1c1a10' },
}

export const RARITIES = ['legendary', 'mythical'] as const

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function generationLabel(generation: number) {
  return ROMAN[generation - 1] ?? String(generation)
}

export function formatNumber(id: number) {
  return String(id).padStart(3, '0')
}

export function typeColor(type: string | undefined) {
  return (type && POKEMON_TYPES[type]?.color) || '#b5b09a'
}

const ARTWORK_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

export function artworkUrl(id: number) {
  return `${ARTWORK_BASE}/${id}.png`
}
