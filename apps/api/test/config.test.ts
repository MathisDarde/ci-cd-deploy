import { describe, expect, it } from 'vitest'
import { createAppFromEnv } from '../src/config'

describe('createAppFromEnv', () => {
  it('uses the in-memory storage locally', async () => {
    const app = createAppFromEnv({ APP_ENV: 'loc', APP_VERSION: 'abc123' })
    const res = await app.request('/health')
    expect(await res.json()).toEqual({ status: 'ok', version: 'abc123', environment: 'loc' })
  })

  it('refuses to start without a database outside local environments', () => {
    expect(() => createAppFromEnv({ APP_ENV: 'prd' })).toThrow(/DATABASE_URL/)
  })
})
