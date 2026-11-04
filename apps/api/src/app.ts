import type { ApiError, WishlistErrorCode } from '@pokewishlist/shared'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { type ErrorKey, type Locale, DEFAULT_LOCALE, resolveLocale, translateError } from './i18n'
import type { WishlistRepository } from './repository'

export interface AppOptions {
  repo: WishlistRepository
  /** Allowed browser origins; ['*'] allows any. */
  corsOrigins?: string[]
  version?: string
  environment?: string
}

type Env = { Variables: { locale: Locale } }
type ErrorCode = WishlistErrorCode | 'ROUTE_NOT_FOUND'

const STATUS: Record<ErrorCode, ContentfulStatusCode> = {
  INVALID_POKEMON: 400,
  DUPLICATE_POKEMON: 409,
  WISHLIST_FULL: 409,
  POKEMON_NOT_FOUND: 404,
  ROUTE_NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
}

function parseId(raw: string): number | null {
  return /^\d{1,6}$/.test(raw) ? Number(raw) : null
}

function errorBody(locale: Locale, code: ErrorCode) {
  return { error: { code, message: translateError(locale, code as ErrorKey) } } as ApiError
}

export function createApp({
  repo,
  corsOrigins = ['*'],
  version = 'dev',
  environment = 'loc',
}: AppOptions) {
  const app = new Hono<Env>()

  app.use(
    '*',
    cors({
      origin: corsOrigins.includes('*') ? '*' : corsOrigins,
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Accept-Language'],
      maxAge: 600,
    }),
  )

  app.use('*', async (c, next) => {
    const locale = resolveLocale(c.req.query('lang'), c.req.header('Accept-Language'))
    c.set('locale', locale)
    c.header('Content-Language', locale)
    c.header('Vary', 'Accept-Language', { append: true })
    await next()
  })

  const fail = (locale: Locale | undefined, code: ErrorCode) =>
    [errorBody(locale ?? DEFAULT_LOCALE, code), STATUS[code]] as const

  app.get('/health', c => c.json({ status: 'ok', version, environment }))

  app.get('/wishlist', async c => c.json({ items: await repo.list() }))

  app.post('/wishlist', async c => {
    const body: unknown = await c.req.json().catch(() => null)
    const result = await repo.add(body)
    if (!result.ok) return c.json(...fail(c.get('locale'), result.code))
    return c.json({ item: result.item }, 201)
  })

  app.delete('/wishlist/:id', async c => {
    const id = parseId(c.req.param('id'))
    if (id === null) return c.json(...fail(c.get('locale'), 'INVALID_POKEMON'))
    if (!(await repo.remove(id))) return c.json(...fail(c.get('locale'), 'POKEMON_NOT_FOUND'))
    return c.body(null, 204)
  })

  app.post('/wishlist/:id/like', async c => {
    const id = parseId(c.req.param('id'))
    if (id === null) return c.json(...fail(c.get('locale'), 'INVALID_POKEMON'))
    const item = await repo.like(id)
    if (!item) return c.json(...fail(c.get('locale'), 'POKEMON_NOT_FOUND'))
    return c.json({ item })
  })

  app.notFound(c => c.json(...fail(c.get('locale'), 'ROUTE_NOT_FOUND')))

  app.onError((error, c) => {
    console.error('Unhandled API error', error)
    return c.json(...fail(c.get('locale'), 'INTERNAL_ERROR'))
  })

  return app
}

export type App = ReturnType<typeof createApp>
