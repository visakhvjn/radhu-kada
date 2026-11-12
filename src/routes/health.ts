import { Hono } from 'hono'
import type { AppBindings } from '../types/hono'
import { getDb } from '../db/client'

export const healthRoutes = new Hono<AppBindings>()

healthRoutes.get('/', (c) =>
  c.json({ status: 'ok', service: 'radhu', version: '0.1.0', mcp: '/mcp' }),
)

healthRoutes.get('/db', async (c) => {
  try {
    const database = await getDb()
    await database.command({ ping: 1 })
    return c.json({ status: 'ok', database: database.databaseName })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database ping failed'
    return c.json({ status: 'error', message }, 503)
  }
})
