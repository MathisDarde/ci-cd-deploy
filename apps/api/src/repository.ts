import { addPokemon, type AddResult, removePokemon, type WishlistItem } from '@pokewishlist/shared'

/** Storage for the wishlist. Implementations enforce the business rules atomically. */
export interface WishlistRepository {
  list(): Promise<WishlistItem[]>
  /** Validates the untrusted input, then applies the duplicate and 6-Pokémon rules. */
  add(input: unknown): Promise<AddResult>
  /** @returns false when the id is not in the wishlist */
  remove(id: number): Promise<boolean>
  /** @returns the updated item, or null when the id is not in the wishlist */
  like(id: number): Promise<WishlistItem | null>
}

/** In-memory array: the "no database" step of the TP, and fast route tests. */
export class MemoryRepository implements WishlistRepository {
  private items: WishlistItem[]

  constructor(initial: WishlistItem[] = []) {
    this.items = [...initial]
  }

  async list() {
    return this.items.map(item => ({ ...item }))
  }

  async add(input: unknown) {
    const result = addPokemon(this.items, input)
    if (result.ok) this.items = result.items
    return result
  }

  async remove(id: number) {
    const before = this.items.length
    this.items = removePokemon(this.items, id)
    return this.items.length !== before
  }

  async like(id: number) {
    const item = this.items.find(entry => entry.id === id)
    if (!item) return null
    item.likes += 1
    return { ...item }
  }
}
