import { createMiddleware } from 'hono/factory'
import { getDb } from '../db/client'
import { ensureIndexes } from '../db/indexes'

let indexesReady = false

export const dbMiddleware = createMiddleware(async (c, next) => {
  if (c.req.path === '/health' || c.req.path.startsWith('/mcp')) {
    await next()
    return
  }

  const database = await getDb()
  c.set('db', database)

  if (!indexesReady) {
    await ensureIndexes()
    indexesReady = true
  }

  await next()
})
