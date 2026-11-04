import type { WishlistItem } from '@pokewishlist/shared'

export const WISHLIST_STORAGE_KEY = 'pokewishlist:wishlist:v1'

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

function isWishlistItem(value: unknown): value is WishlistItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    Number.isInteger(item.id) &&
    typeof item.name === 'string' &&
    Number.isInteger(item.likes) &&
    typeof item.createdAt === 'string'
  )
}

/**
 * Reads the wishlist saved in localStorage.
 * Never throws: missing, corrupted or foreign data gives an empty list,
 * so a bad value can't crash the app.
 */
export function loadWishlist(storage: ReadableStorage | undefined): WishlistItem[] {
  try {
    const raw = storage?.getItem(WISHLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isWishlistItem) : []
  } catch {
    return []
  }
}

/** @returns false when the storage is unavailable or full: the app keeps working without it. */
export function saveWishlist(storage: WritableStorage | undefined, items: WishlistItem[]): boolean {
  try {
    if (!storage) return false
    storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}
