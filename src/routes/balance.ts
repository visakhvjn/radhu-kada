import { Hono } from 'hono'
import type { AppBindings } from '../types/hono'
import { getBalanceDue } from '../lib/ledger'

export const balanceRoutes = new Hono<AppBindings>()

balanceRoutes.get('/', async (c) => {
  const balanceDue = await getBalanceDue(c.get('db'))
  return c.json({ balanceDue })
})
