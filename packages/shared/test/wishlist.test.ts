import { describe, expect, it } from 'vitest'
import { WISHLIST_LIMIT, addPokemon, parseNewItem, removePokemon, type WishlistItem } from '../src'

const fixedNow = () => new Date('2026-01-01T00:00:00.000Z')
const item = (id: number): WishlistItem => ({ id, name: `p${id}`, likes: 0, createdAt: '' })

describe('parseNewItem', () => {
  it('accepts a valid id and slug', () => {
    expect(parseNewItem({ id: 25, name: 'pikachu' })).toEqual({ id: 25, name: 'pikachu' })
    expect(parseNewItem({ id: 122, name: 'mr-mime' })).toEqual({ id: 122, name: 'mr-mime' })
  })

  it.each([
    null,
    'pikachu',
    {},
    { id: '25', name: 'pikachu' },
    { id: 0, name: 'pikachu' },
    { id: 2.5, name: 'pikachu' },
    { id: 25, name: '' },
    { id: 25, name: 'Pikachu' },
    { id: 25, name: '<script>' },
    { id: 25, name: 'a'.repeat(65) },
    { id: 25, name: 'pikachu!' },
    { id: 25, name: 25 },
    { id: 100_001, name: 'pikachu' },
  ])('rejects %j', input => {
    expect(parseNewItem(input)).toBeNull()
  })

  it('accepts the boundaries', () => {
    expect(parseNewItem({ id: 1, name: 'a'.repeat(64) })).not.toBeNull()
    expect(parseNewItem({ id: 100_000, name: 'a' })).not.toBeNull()
  })
})

describe('addPokemon', () => {
  it('adds a Pokémon to an empty list', () => {
    const result = addPokemon([], { id: 25, name: 'pikachu' }, fixedNow)
    expect(result).toEqual({
      ok: true,
      item: { id: 25, name: 'pikachu', likes: 0, createdAt: '2026-01-01T00:00:00.000Z' },
      items: [{ id: 25, name: 'pikachu', likes: 0, createdAt: '2026-01-01T00:00:00.000Z' }],
    })
  })

  it('does not mutate the input list', () => {
    const items = [item(1)]
    addPokemon(items, { id: 2, name: 'ivysaur' })
    expect(items).toHaveLength(1)
  })

  it('refuses a duplicate', () => {
    expect(addPokemon([item(25)], { id: 25, name: 'pikachu' })).toEqual({
      ok: false,
      code: 'DUPLICATE_POKEMON',
    })
  })

  it(`accepts the ${WISHLIST_LIMIT}th Pokémon`, () => {
    const items = Array.from({ length: WISHLIST_LIMIT - 1 }, (_, i) => item(i + 1))
    const result = addPokemon(items, { id: 100, name: 'voltorb' })
    expect(result.ok && result.items).toHaveLength(WISHLIST_LIMIT)
  })

  it('refuses a 7th Pokémon when the list is full', () => {
    const items = Array.from({ length: WISHLIST_LIMIT }, (_, i) => item(i + 1))
    expect(addPokemon(items, { id: 100, name: 'voltorb' })).toEqual({
      ok: false,
      code: 'WISHLIST_FULL',
    })
  })

  it('reports a duplicate before a full list', () => {
    const items = Array.from({ length: WISHLIST_LIMIT }, (_, i) => item(i + 1))
    expect(addPokemon(items, { id: 1, name: 'p1' })).toEqual({
      ok: false,
      code: 'DUPLICATE_POKEMON',
    })
  })

  it('refuses invalid input', () => {
    expect(addPokemon([], { id: -1, name: 'x' })).toEqual({ ok: false, code: 'INVALID_POKEMON' })
  })
})

describe('removePokemon', () => {
  it('removes by id', () => {
    expect(removePokemon([item(1), item(2)], 1)).toEqual([item(2)])
  })

  it('is a no-op for an unknown id', () => {
    expect(removePokemon([item(1)], 9)).toEqual([item(1)])
  })
})
