import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AppBindings } from './types/hono'
import { dbMiddleware } from './middleware/db'
import { healthRoutes } from './routes/health'
import { expenseRoutes } from './routes/expenses'
import { paymentRoutes } from './routes/payments'
import { balanceRoutes } from './routes/balance'
import { mcpRoutes } from './routes/mcp'
import { reportRoutes } from './routes/reports'

export function createApp() {
  const app = new Hono<AppBindings>()

  app.use('*', logger())
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'mcp-session-id',
        'Last-Event-ID',
        'mcp-protocol-version',
      ],
      exposeHeaders: ['mcp-session-id', 'mcp-protocol-version'],
    }),
  )
  app.use('*', dbMiddleware)

  app.get('/', (c) => c.redirect('/reports/monthly'))
  app.route('/health', healthRoutes)
  app.route('/expenses', expenseRoutes)
  app.route('/payments', paymentRoutes)
  app.route('/balance', balanceRoutes)
  app.route('/reports', reportRoutes)
  app.route('/mcp', mcpRoutes)

  app.notFound((c) => c.json({ error: 'Not found' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}
