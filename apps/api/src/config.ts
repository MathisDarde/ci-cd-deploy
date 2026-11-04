import { createApp } from './app'
import { createSql, PostgresRepository } from './postgres'
import { MemoryRepository, type WishlistRepository } from './repository'

/** Replaced by esbuild at build time (build.mjs); undefined when run from sources. */
declare const __APP_VERSION__: string | undefined
const BUILD_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : undefined

/**
 * Builds the app from environment variables: the same artefact runs in every
 * environment, only the configuration changes.
 */
export function createAppFromEnv(env: NodeJS.ProcessEnv = process.env, poolSize?: number) {
  let repo: WishlistRepository
  if (env.DATABASE_URL) {
    repo = new PostgresRepository(createSql(env.DATABASE_URL, { max: poolSize }))
  } else {
    if (env.APP_ENV && !['loc', 'int', 'test'].includes(env.APP_ENV)) {
      throw new Error(`DATABASE_URL is required in the "${env.APP_ENV}" environment`)
    }
    repo = new MemoryRepository()
  }

  return createApp({
    repo,
    corsOrigins: (env.CORS_ORIGINS ?? '*').split(',').map(origin => origin.trim()),
    version: env.APP_VERSION ?? BUILD_VERSION ?? 'dev',
    environment: env.APP_ENV ?? 'loc',
  })
}
