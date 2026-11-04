import { WISHLIST_LIMIT, type WishlistItem } from '@pokewishlist/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { MemoryRepository, type WishlistRepository } from '../src/repository'

let repo: MemoryRepository
let app: ReturnType<typeof createApp>

beforeEach(() => {
  repo = new MemoryRepository()
  app = createApp({ repo, version: '1.2.3', environment: 'test' })
})

const post = (body: unknown, headers: Record<string, string> = {}) =>
  app.request('/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('GET /health', () => {
  it('returns 200 with the version', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', version: '1.2.3', environment: 'test' })
  })
})

describe('GET /wishlist', () => {
  it('returns an empty list at start', async () => {
    const res = await app.request('/wishlist')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ items: [] })
  })
})

describe('POST /wishlist', () => {
  it('adds a Pokémon (201) and lists it', async () => {
    const res = await post({ id: 25, name: 'pikachu' })
    expect(res.status).toBe(201)
    const { item } = (await res.json()) as { item: WishlistItem }
    expect(item).toMatchObject({ id: 25, name: 'pikachu', likes: 0 })

    const list = (await (await app.request('/wishlist')).json()) as { items: WishlistItem[] }
    expect(list.items.map(i => i.id)).toEqual([25])
  })

  it('refuses a duplicate with 409', async () => {
    await post({ id: 25, name: 'pikachu' })
    const res = await post({ id: 25, name: 'pikachu' })
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: { code: 'DUPLICATE_POKEMON' } })
  })

  it(`refuses a Pokémon beyond ${WISHLIST_LIMIT} with 409`, async () => {
    for (let id = 1; id <= WISHLIST_LIMIT; id++) {
      expect((await post({ id, name: `p${id}` })).status).toBe(201)
    }
    const res = await post({ id: 100, name: 'voltorb' })
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: { code: 'WISHLIST_FULL' } })
    expect(await repo.list()).toHaveLength(WISHLIST_LIMIT)
  })

  it.each([
    ['malformed JSON', '{"id":'],
    ['missing name', { id: 25 }],
    ['string id', { id: '25', name: 'pikachu' }],
    ['negative id', { id: -4, name: 'pikachu' }],
    ['invalid name', { id: 25, name: 'Robert); DROP TABLE wishlist;--' }],
  ])('refuses %s with 400', async (_label, body) => {
    const res = await post(body)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: 'INVALID_POKEMON' } })
  })
})

describe('DELETE /wishlist/:id', () => {
  it('removes an existing Pokémon (204)', async () => {
    await post({ id: 25, name: 'pikachu' })
    const res = await app.request('/wishlist/25', { method: 'DELETE' })
    expect(res.status).toBe(204)
    expect(await repo.list()).toEqual([])
  })

  it('returns 404 for an unknown Pokémon', async () => {
    const res = await app.request('/wishlist/25', { method: 'DELETE' })
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: { code: 'POKEMON_NOT_FOUND' } })
  })

  it('returns 400 for a non-numeric id', async () => {
    const res = await app.request('/wishlist/abc', { method: 'DELETE' })
    expect(res.status).toBe(400)
  })

  it('frees a slot once a full list loses a Pokémon', async () => {
    for (let id = 1; id <= WISHLIST_LIMIT; id++) await post({ id, name: `p${id}` })
    await app.request('/wishlist/1', { method: 'DELETE' })
    expect((await post({ id: 100, name: 'voltorb' })).status).toBe(201)
  })
})

describe('POST /wishlist/:id/like', () => {
  it('increments the likes', async () => {
    await post({ id: 25, name: 'pikachu' })
    await app.request('/wishlist/25/like', { method: 'POST' })
    const res = await app.request('/wishlist/25/like', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ item: { id: 25, likes: 2 } })
  })

  it('returns 404 for an unknown Pokémon', async () => {
    expect((await app.request('/wishlist/7/like', { method: 'POST' })).status).toBe(404)
  })

  it('returns 400 for an invalid id', async () => {
    expect((await app.request('/wishlist/x/like', { method: 'POST' })).status).toBe(400)
  })
})

describe('i18n of API errors', () => {
  it('answers in English by default', async () => {
    await post({ id: 25, name: 'pikachu' })
    const res = await post({ id: 25, name: 'pikachu' })
    expect(res.headers.get('Content-Language')).toBe('en')
    expect(await res.json()).toMatchObject({
      error: { message: 'This Pokémon is already in your wishlist.' },
    })
  })

  it.each([
    ['fr-FR,fr;q=0.9', 'Ce Pokémon est déjà dans votre liste.'],
    ['es', 'Este Pokémon ya está en tu lista.'],
    ['de-DE', 'Dieses Pokémon ist bereits auf deiner Wunschliste.'],
  ])('follows Accept-Language: %s', async (header, message) => {
    await post({ id: 25, name: 'pikachu' })
    const res = await post({ id: 25, name: 'pikachu' }, { 'Accept-Language': header })
    expect(await res.json()).toMatchObject({ error: { message } })
  })
})

describe('errors and CORS', () => {
  it('returns a JSON 404 for an unknown route', async () => {
    const res = await app.request('/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: { code: 'ROUTE_NOT_FOUND' } })
  })

  it('returns a localized 500 when the storage fails', async () => {
    const broken: WishlistRepository = {
      list: () => Promise.reject(new Error('db down')),
      add: () => Promise.reject(new Error('db down')),
      remove: () => Promise.reject(new Error('db down')),
      like: () => Promise.reject(new Error('db down')),
    }
    const failing = createApp({ repo: broken })
    const originalError = console.error
    console.error = () => {}
    try {
      const res = await failing.request('/wishlist', { headers: { 'Accept-Language': 'fr' } })
      expect(res.status).toBe(500)
      expect(await res.json()).toMatchObject({ error: { code: 'INTERNAL_ERROR' } })
    } finally {
      console.error = originalError
    }
  })

  it('only allows configured origins', async () => {
    const restricted = createApp({ repo, corsOrigins: ['https://front.example'] })
    const allowed = await restricted.request('/health', {
      headers: { Origin: 'https://front.example' },
    })
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('https://front.example')
    const denied = await restricted.request('/health', {
      headers: { Origin: 'https://evil.example' },
    })
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
