import type { WishlistItem } from '@pokewishlist/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadWishlist, saveWishlist, WISHLIST_STORAGE_KEY } from '../app/utils/wishlist-storage'

/** Minimal in-memory localStorage. */
class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const pikachu: WishlistItem = {
  id: 25,
  name: 'pikachu',
  likes: 2,
  createdAt: '2026-01-01T00:00:00Z',
}
let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
})

describe('wishlist storage', () => {
  it('saves then reads the wishlist', () => {
    expect(saveWishlist(storage, [pikachu])).toBe(true)
    expect(loadWishlist(storage)).toEqual([pikachu])
  })

  it('returns an empty list when nothing is stored', () => {
    expect(loadWishlist(storage)).toEqual([])
  })

  it('returns an empty list when storage is unavailable (SSR)', () => {
    expect(loadWishlist(undefined)).toEqual([])
    expect(saveWishlist(undefined, [pikachu])).toBe(false)
  })

  it.each(['{not json', 'undefined', '', '"pikachu"', '{"id":25}', 'null', '42'])(
    'does not crash on corrupted data: %s',
    raw => {
      storage.setItem(WISHLIST_STORAGE_KEY, raw)
      expect(loadWishlist(storage)).toEqual([])
    },
  )

  it('drops invalid entries and keeps the valid ones', () => {
    storage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify([pikachu, { id: 'x' }, null, { ...pikachu, id: 1, likes: '3' }]),
    )
    expect(loadWishlist(storage)).toEqual([pikachu])
  })

  it('does not crash when reading throws (privacy mode)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError')
      },
    }
    expect(loadWishlist(throwing)).toEqual([])
  })

  it('reports a full storage instead of throwing', () => {
    const full = {
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(saveWishlist(full, [pikachu])).toBe(false)
  })
})
