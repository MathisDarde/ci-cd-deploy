import { serve } from '@hono/node-server'
import { createAppFromEnv } from './config'

const port = Number(process.env.PORT ?? 3001)
const app = createAppFromEnv()

serve({ fetch: app.fetch, port }, info => {
  console.warn(
    `PokéWishlist API on http://localhost:${info.port} (${process.env.DATABASE_URL ? 'PostgreSQL' : 'in-memory'})`,
  )
})
