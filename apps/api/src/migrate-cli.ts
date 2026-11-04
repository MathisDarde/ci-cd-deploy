import { fileURLToPath } from 'node:url'
import { runInit, runMigrations } from './migrate'
import { createSql } from './postgres'

// Usage: DATABASE_URL=postgres://… pnpm db:migrate
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) {
  console.error('MIGRATION_DATABASE_URL or DATABASE_URL is required')
  process.exit(1)
}

const dbDir = new URL('../../../db/', import.meta.url)
const sql = createSql(url, { max: 1 })

try {
  await runInit(sql, fileURLToPath(new URL('init.sql', dbDir)))
  const report = await runMigrations(sql, fileURLToPath(new URL('migrations/', dbDir)), message =>
    console.warn(message),
  )
  console.warn(`${report.applied.length} applied, ${report.skipped.length} already up to date`)
} catch (error) {
  console.error('Migration failed', error)
  process.exitCode = 1
} finally {
  await sql.end()
}
