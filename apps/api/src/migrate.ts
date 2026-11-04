import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Sql } from './postgres'

const FILE_PATTERN = /^\d{3}_[a-z0-9_]+\.sql$/

export interface MigrationReport {
  applied: string[]
  skipped: string[]
}

/**
 * Home-made SQL migration runner.
 * - files `NNN_name.sql` are applied in order, each in its own transaction;
 * - `schema_migrations` records what ran, so each file runs exactly once;
 * - a failing file is rolled back and stops the run (later files are not applied).
 */
export async function runMigrations(
  sql: Sql,
  directory: string,
  log: (message: string) => void = () => {},
): Promise<MigrationReport> {
  await sql`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )`

  const files = (await readdir(directory)).filter(file => FILE_PATTERN.test(file)).sort()
  const done = new Set(
    (await sql<{ version: string }[]>`select version from schema_migrations`).map(r => r.version),
  )

  const report: MigrationReport = { applied: [], skipped: [] }
  for (const file of files) {
    if (done.has(file)) {
      report.skipped.push(file)
      continue
    }
    const content = await readFile(join(directory, file), 'utf8')
    await sql.begin(async tx => {
      // The file is trusted, versioned code: simple protocol to allow several statements.
      await tx.unsafe(content)
      await tx`insert into schema_migrations (version) values (${file})`
    })
    log(`applied ${file}`)
    report.applied.push(file)
  }
  return report
}

/** Runs db/init.sql: idempotent, safe to run on an existing database. */
export async function runInit(sql: Sql, file: string) {
  await sql.unsafe(await readFile(file, 'utf8'))
}
