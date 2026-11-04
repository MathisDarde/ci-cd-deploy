/** A team holds at most six Pokémon, like in the games. */
export const WISHLIST_LIMIT = 6

export interface WishlistItem {
  /** National Pokédex number, also the item id in the API. */
  id: number
  /** PokéAPI slug, e.g. "pikachu". */
  name: string
  likes: number
  createdAt: string
}

export interface NewWishlistItem {
  id: number
  name: string
}

export type WishlistErrorCode =
  'INVALID_POKEMON' | 'DUPLICATE_POKEMON' | 'WISHLIST_FULL' | 'POKEMON_NOT_FOUND' | 'INTERNAL_ERROR'

export interface ApiError {
  error: { code: WishlistErrorCode; message: string }
}

export type AddResult =
  | { ok: true; items: WishlistItem[]; item: WishlistItem }
  | { ok: false; code: Exclude<WishlistErrorCode, 'POKEMON_NOT_FOUND' | 'INTERNAL_ERROR'> }

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Validates untrusted input (request body, storage) into a NewWishlistItem. */
export function parseNewItem(input: unknown): NewWishlistItem | null {
  if (typeof input !== 'object' || input === null) return null
  const { id, name } = input as Record<string, unknown>
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > 100_000) return null
  if (typeof name !== 'string' || name.length > 64 || !SLUG.test(name)) return null
  return { id, name }
}

/** Checks the business rules: why the item can't be added, or null if it can. */
export function checkCanAdd(
  items: readonly Pick<WishlistItem, 'id'>[],
  candidate: Pick<WishlistItem, 'id'>,
): Exclude<AddResult, { ok: true }>['code'] | null {
  if (items.some(item => item.id === candidate.id)) return 'DUPLICATE_POKEMON'
  if (items.length >= WISHLIST_LIMIT) return 'WISHLIST_FULL'
  return null
}

/** Pure add: returns a new list, never mutates the input. */
export function addPokemon(
  items: readonly WishlistItem[],
  input: unknown,
  now: () => Date = () => new Date(),
): AddResult {
  const candidate = parseNewItem(input)
  if (!candidate) return { ok: false, code: 'INVALID_POKEMON' }
  const refusal = checkCanAdd(items, candidate)
  if (refusal) return { ok: false, code: refusal }
  const item: WishlistItem = { ...candidate, likes: 0, createdAt: now().toISOString() }
  return { ok: true, item, items: [...items, item] }
}

export function removePokemon(items: readonly WishlistItem[], id: number): WishlistItem[] {
  return items.filter(item => item.id !== id)
}
