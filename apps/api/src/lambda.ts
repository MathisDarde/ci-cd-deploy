import { handle } from 'hono/aws-lambda'
import { createAppFromEnv } from './config'

// Created once per Lambda container and reused across invocations (warm starts).
// One connection per container: concurrency comes from containers, not from a pool.
const app = createAppFromEnv(process.env, 1)

export const handler = handle(app)
