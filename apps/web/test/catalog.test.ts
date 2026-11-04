import { describe, expect, it } from 'vitest'
import type { CatalogPokemon } from '../app/utils/catalog-api'
import { applyCatalogFilters, type CatalogFilters } from '../app/utils/catalog'
import { artworkUrl, formatNumber, generationLabel, typeColor } from '../app/utils/display'

const make = (overrides: Partial<CatalogPokemon>): CatalogPokemon => ({
  id: 1,
  name: 'Bulbizarre',
  slug: 'bulbasaur',
  generation: 1,
  rarity: 'common',
  types: ['grass', 'poison'],
  height: 0.7,
  weight: 6.9,
  stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
  totalStats: 318,
  ...overrides,
})

const list = [
  make({}),
  make({ id: 25, name: 'Pikachu', slug: 'pikachu', types: ['electric'], totalStats: 320 }),
  make({
    id: 150,
    name: 'Mewtwo',
    slug: 'mewtwo',
    rarity: 'legendary',
    types: ['psychic'],
    totalStats: 680,
  }),
  make({
    id: 251,
    name: 'Célébi',
    slug: 'celebi',
    generation: 2,
    rarity: 'mythical',
    types: ['psychic', 'grass'],
    totalStats: 600,
  }),
]

const filters = (overrides: Partial<CatalogFilters> = {}): CatalogFilters => ({
  q: '',
  types: [],
  generation: null,
  rarity: null,
  sort: 'id',
  dir: 'asc',
  ...overrides,
})

const ids = (result: CatalogPokemon[]) => result.map(p => p.id)

describe('applyCatalogFilters', () => {
  it('keeps everything without filters, by number', () => {
    expect(ids(applyCatalogFilters(list, filters()))).toEqual([1, 25, 150, 251])
  })

  it('searches the localized name without accents, and the slug', () => {
    expect(ids(applyCatalogFilters(list, filters({ q: 'celebi' })))).toEqual([251])
    expect(ids(applyCatalogFilters(list, filters({ q: 'BULBA' })))).toEqual([1])
  })

  it('searches by number prefix or exact padded number', () => {
    expect(ids(applyCatalogFilters(list, filters({ q: '25' })))).toEqual([25, 251])
    expect(ids(applyCatalogFilters(list, filters({ q: '#025' })))).toEqual([25])
  })

  it('combines type, generation and rarity filters', () => {
    expect(ids(applyCatalogFilters(list, filters({ types: ['psychic'] })))).toEqual([150, 251])
    expect(ids(applyCatalogFilters(list, filters({ types: ['psychic', 'grass'] })))).toEqual([251])
    expect(ids(applyCatalogFilters(list, filters({ generation: 2 })))).toEqual([251])
    expect(ids(applyCatalogFilters(list, filters({ rarity: 'legendary' })))).toEqual([150])
  })

  it('sorts by stat, descending', () => {
    expect(ids(applyCatalogFilters(list, filters({ sort: 'totalStats', dir: 'desc' })))).toEqual([
      150, 251, 25, 1,
    ])
  })

  it('sorts names with the locale rules', () => {
    expect(ids(applyCatalogFilters(list, filters({ sort: 'name' }), 'fr'))).toEqual([
      1, 251, 150, 25,
    ])
  })
})

describe('display helpers', () => {
  it('formats numbers and generations', () => {
    expect(formatNumber(7)).toBe('007')
    expect(generationLabel(4)).toBe('IV')
    expect(generationLabel(42)).toBe('42')
  })

  it('falls back to a neutral color for unknown types', () => {
    expect(typeColor('fire')).toBe('#f4803c')
    expect(typeColor('unknown')).toBe('#b5b09a')
    expect(typeColor(undefined)).toBe('#b5b09a')
  })

  it('builds artwork URLs', () => {
    expect(artworkUrl(25)).toMatch(/official-artwork\/25\.png$/)
  })
})
