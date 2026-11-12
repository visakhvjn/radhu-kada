import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AppBindings } from '../types/hono'
import { listPayments, recordPayment } from '../lib/ledger'
import { isPositiveAmount } from '../lib/money'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  date: dateString.optional(),
  note: z.string().max(500).optional(),
})

const listQuerySchema = z.object({
  from: dateString,
  to: dateString,
})

export const paymentRoutes = new Hono<AppBindings>()

paymentRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { from, to } = c.req.valid('query')
  try {
    const payments = await listPayments(c.get('db'), { from, to })
    return c.json({ payments })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list payments'
    return c.json({ error: message }, 400)
  }
})

paymentRoutes.post('/', zValidator('json', createPaymentSchema), async (c) => {
  const body = c.req.valid('json')
  if (!isPositiveAmount(body.amount)) {
    return c.json({ error: 'amount must be a positive number' }, 400)
  }

  try {
    const result = await recordPayment(c.get('db'), body)
    return c.json(result, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record payment'
    return c.json({ error: message }, 400)
  }
})
