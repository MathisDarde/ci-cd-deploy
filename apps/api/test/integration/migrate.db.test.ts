import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { runMigrations } from '../../src/migrate'
import { createSql } from '../../src/postgres'

const sql = createSql(process.env.TEST_DATABASE_URL!, { max: 1 })
let dir: string

beforeEach(async () => {
  // A scratch schema keeps these tests away from the real wishlist table.
  await sql`drop schema if exists migrate_test cascade`
  await sql`create schema migrate_test`
  await sql`set search_path to migrate_test`
  dir = await mkdtemp(join(tmpdir(), 'migrations-'))
})

afterAll(async () => {
  await sql`drop schema if exists migrate_test cascade`
  await sql.end()
  await rm(dir, { recursive: true, force: true })
})

describe('runMigrations', () => {
  it('applies each file once, in order, and keeps the data', async () => {
    await writeFile(join(dir, '000_items.sql'), 'create table items (id int primary key);')
    expect(await runMigrations(sql, dir)).toEqual({ applied: ['000_items.sql'], skipped: [] })
    await sql`insert into items (id) values (1), (2)`

    await writeFile(
      join(dir, '001_likes.sql'),
      'alter table items add column likes int not null default 0;',
    )
    expect(await runMigrations(sql, dir)).toEqual({
      applied: ['001_likes.sql'],
      skipped: ['000_items.sql'],
    })
    expect(await runMigrations(sql, dir)).toEqual({
      applied: [],
      skipped: ['000_items.sql', '001_likes.sql'],
    })

    const rows = await sql`select id, likes from items order by id`
    expect(rows).toEqual([
      { id: 1, likes: 0 },
      { id: 2, likes: 0 },
    ])
  })

  it('rolls back a failing file and does not record it', async () => {
    await writeFile(
      join(dir, '000_broken.sql'),
      'create table half (id int); select * from does_not_exist;',
    )
    await expect(runMigrations(sql, dir)).rejects.toThrow()
    const [row] = await sql`select to_regclass('migrate_test.half') is not null as exists`
    expect(row?.exists).toBe(false)
    expect(await sql`select version from schema_migrations`).toEqual([])
  })

  it('ignores files that do not follow the NNN_name.sql pattern', async () => {
    await writeFile(join(dir, 'notes.sql'), 'this is not sql')
    expect(await runMigrations(sql, dir)).toEqual({ applied: [], skipped: [] })
  })
})
