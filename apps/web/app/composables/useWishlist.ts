import {
  WISHLIST_LIMIT,
  type ApiError,
  type NewWishlistItem,
  type WishlistItem,
} from '@pokewishlist/shared'
import { loadWishlist, saveWishlist } from '~/utils/wishlist-storage'

export interface Notice {
  id: number
  kind: 'success' | 'error'
  text: string
}

/**
 * The wishlist lives in the Hono API (GET/POST/DELETE /wishlist).
 * localStorage only keeps the last known copy, shown instantly while the API answers.
 */
export function useWishlist() {
  const config = useRuntimeConfig()
  const { locale, t } = useI18n()

  const items = useState<WishlistItem[]>('wishlist:items', () => [])
  const status = useState<'idle' | 'loading' | 'ready' | 'error'>('wishlist:status', () => 'idle')
  const notices = useState<Notice[]>('wishlist:notices', () => [])

  const ids = computed(() => new Set(items.value.map(item => item.id)))
  const isFull = computed(() => items.value.length >= WISHLIST_LIMIT)

  const api = <T>(path: string, options: Parameters<typeof $fetch>[1] = {}) =>
    $fetch<T>(path, {
      ...options,
      baseURL: config.public.apiBase,
      // The API translates its error messages from this header.
      headers: { 'Accept-Language': locale.value },
    })

  function notify(kind: Notice['kind'], text: string) {
    const notice = { id: Date.now() + Math.random(), kind, text }
    notices.value = [...notices.value.slice(-2), notice]
    setTimeout(() => dismiss(notice.id), 6000)
  }

  function dismiss(id: number) {
    notices.value = notices.value.filter(notice => notice.id !== id)
  }

  /** The API's error body, when the request reached the API. */
  function apiError(error: unknown) {
    const data = (error as { data?: Partial<ApiError> } | null)?.data
    return data?.error
  }

  const apiMessage = (error: unknown) => apiError(error)?.message ?? t('wishlist.networkError')
  const apiCode = (error: unknown) => apiError(error)?.code

  function commit(next: WishlistItem[]) {
    items.value = next
    saveWishlist(import.meta.client ? localStorage : undefined, next)
  }

  async function refresh() {
    if (status.value !== 'ready') status.value = 'loading'
    try {
      const { items: fresh } = await api<{ items: WishlistItem[] }>('/wishlist')
      commit(fresh)
      status.value = 'ready'
    } catch (error) {
      console.error('Wishlist loading failed', error)
      status.value = 'error'
    }
  }

  /** Client only: shows the cached copy, then the API's truth. */
  function init() {
    if (!import.meta.client || status.value !== 'idle') return
    items.value = loadWishlist(localStorage)
    void refresh()
  }

  async function add(pokemon: NewWishlistItem & { displayName: string }) {
    try {
      const { item } = await api<{ item: WishlistItem }>('/wishlist', {
        method: 'POST',
        body: { id: pokemon.id, name: pokemon.name },
      })
      commit([...items.value.filter(i => i.id !== item.id), item])
      notify('success', t('wishlist.added', { name: pokemon.displayName }))
    } catch (error) {
      notify('error', apiMessage(error))
      // Someone else (another tab) changed the list: resync.
      if (apiCode(error) === 'DUPLICATE_POKEMON' || apiCode(error) === 'WISHLIST_FULL') {
        await refresh()
      }
    }
  }

  async function remove(id: number, displayName: string) {
    try {
      await api(`/wishlist/${id}`, { method: 'DELETE' })
      notify('success', t('wishlist.removed', { name: displayName }))
    } catch (error) {
      if (apiCode(error) !== 'POKEMON_NOT_FOUND') {
        notify('error', apiMessage(error))
        return
      }
    }
    commit(items.value.filter(item => item.id !== id))
  }

  async function like(id: number) {
    try {
      const { item } = await api<{ item: WishlistItem }>(`/wishlist/${id}/like`, { method: 'POST' })
      commit(items.value.map(entry => (entry.id === id ? item : entry)))
    } catch (error) {
      notify('error', apiMessage(error))
    }
  }

  return { items, status, ids, isFull, notices, init, refresh, add, remove, like, dismiss }
}
