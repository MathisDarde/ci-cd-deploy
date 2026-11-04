import { checkCanAdd, parseNewItem, type AddResult, type WishlistItem } from '@pokewishlist/shared'
import postgres from 'postgres'
import type { WishlistRepository } from './repository'

export type Sql = postgres.Sql

export function createSql(url: string, options: { max?: number } = {}): Sql {
  return postgres(url, {
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
    max: options.max ?? 5,
    idle_timeout: 20,
    onnotice: () => {},
  })
}

interface Row {
  id: number
  name: string
  likes: number
  created_at: Date
}

const toItem = (row: Row): WishlistItem => ({
  id: row.id,
  name: row.name,
  likes: row.likes,
  createdAt: new Date(row.created_at).toISOString(),
})

/** Arbitrary key serializing inserts, so two concurrent requests can't both take the 6th slot. */
const ADD_LOCK = 4242

/** Every query is parameterized: values never end up in the SQL text. */
export class PostgresRepository implements WishlistRepository {
  constructor(private readonly sql: Sql) {}

  async list() {
    const rows = await this.sql<Row[]>`
      select id, name, likes, created_at from wishlist order by created_at, id`
    return rows.map(toItem)
  }

  async add(input: unknown): Promise<AddResult> {
    const candidate = parseNewItem(input)
    if (!candidate) return { ok: false, code: 'INVALID_POKEMON' }

    return this.sql.begin(async tx => {
      await tx`select pg_advisory_xact_lock(${ADD_LOCK})`
      const existing = await tx<{ id: number }[]>`select id from wishlist`
      const refusal = checkCanAdd(existing, candidate)
      if (refusal) return { ok: false as const, code: refusal }

      const [row] = await tx<Row[]>`
        insert into wishlist (id, name) values (${candidate.id}, ${candidate.name})
        returning id, name, likes, created_at`
      const rows = await tx<Row[]>`
        select id, name, likes, created_at from wishlist order by created_at, id`
      return { ok: true as const, item: toItem(row!), items: rows.map(toItem) }
    })
  }

  async remove(id: number) {
    const result = await this.sql`delete from wishlist where id = ${id}`
    return result.count > 0
  }

  async like(id: number) {
    const [row] = await this.sql<Row[]>`
      update wishlist set likes = likes + 1 where id = ${id}
      returning id, name, likes, created_at`
    return row ? toItem(row) : null
  }
}
