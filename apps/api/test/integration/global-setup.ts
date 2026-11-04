import { fileURLToPath } from 'node:url'
import { runInit, runMigrations } from '../../src/migrate'
import { createSql } from '../../src/postgres'

/** Brings the test database to the latest schema once, before every integration file. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL is required for integration tests')

  const db = new URL('../../../../db/', import.meta.url)
  const sql = createSql(url, { max: 1 })
  try {
    await runInit(sql, fileURLToPath(new URL('init.sql', db)))
    await runMigrations(sql, fileURLToPath(new URL('migrations/', db)))
  } finally {
    await sql.end()
  }
}
