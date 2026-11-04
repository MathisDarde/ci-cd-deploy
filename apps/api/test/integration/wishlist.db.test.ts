import { WISHLIST_LIMIT, type WishlistItem } from '@pokewishlist/shared'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app'
import { createSql, PostgresRepository } from '../../src/postgres'

// Real routes + real PostgreSQL: no SQL mock anywhere.
const sql = createSql(process.env.TEST_DATABASE_URL!, { max: 4 })
const app = createApp({ repo: new PostgresRepository(sql) })

beforeEach(async () => {
  await sql`truncate wishlist`
})

afterAll(async () => {
  await sql.end()
})

const add = async (id: number, name = `p${id}`) =>
  app.request('/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name }),
  })

const list = async () =>
  ((await (await app.request('/wishlist')).json()) as { items: WishlistItem[] }).items

describe('wishlist on PostgreSQL', () => {
  it('creates, reads and deletes', async () => {
    expect((await add(25, 'pikachu')).status).toBe(201)
    expect(await list()).toMatchObject([{ id: 25, name: 'pikachu', likes: 0 }])

    expect((await app.request('/wishlist/25', { method: 'DELETE' })).status).toBe(204)
    expect(await list()).toEqual([])
    expect((await app.request('/wishlist/25', { method: 'DELETE' })).status).toBe(404)
  })

  it('persists in the database, not in the process', async () => {
    await add(1, 'bulbasaur')
    const freshApp = createApp({ repo: new PostgresRepository(sql) })
    const res = await freshApp.request('/wishlist')
    expect(await res.json()).toMatchObject({ items: [{ id: 1, name: 'bulbasaur' }] })
  })

  it('refuses duplicates', async () => {
    await add(25, 'pikachu')
    const res = await add(25, 'pikachu')
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ error: { code: 'DUPLICATE_POKEMON' } })
  })

  it(`enforces the ${WISHLIST_LIMIT} Pokémon limit`, async () => {
    for (let id = 1; id <= WISHLIST_LIMIT; id++) expect((await add(id)).status).toBe(201)
    expect((await add(99)).status).toBe(409)
    expect(await list()).toHaveLength(WISHLIST_LIMIT)
  })

  it('enforces the limit under concurrent requests', async () => {
    const statuses = await Promise.all(
      Array.from({ length: 10 }, (_, i) => add(i + 1).then(r => r.status)),
    )
    expect(statuses.filter(s => s === 201)).toHaveLength(WISHLIST_LIMIT)
    expect(await list()).toHaveLength(WISHLIST_LIMIT)
  })

  it('counts likes', async () => {
    await add(25, 'pikachu')
    await app.request('/wishlist/25/like', { method: 'POST' })
    await app.request('/wishlist/25/like', { method: 'POST' })
    expect(await list()).toMatchObject([{ id: 25, likes: 2 }])
  })

  it('stores hostile-looking input as plain data', async () => {
    const res = await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, name: "x'); drop table wishlist; --" }),
    })
    expect(res.status).toBe(400)
    expect(await list()).toEqual([])
  })
})
