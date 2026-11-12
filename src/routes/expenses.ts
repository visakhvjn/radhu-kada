import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AppBindings } from '../types/hono'
import { addExpense, editExpense, listExpenses } from '../lib/ledger'
import { isPositiveAmount } from '../lib/money'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  date: dateString.optional(),
  description: z.string().max(500).optional(),
})

const editExpenseSchema = z
  .object({
    amount: z.number().positive().optional(),
    date: dateString.optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine(
    (value) =>
      value.amount !== undefined ||
      value.date !== undefined ||
      value.description !== undefined,
    { message: 'Provide at least one field to update' },
  )

const listQuerySchema = z.object({
  from: dateString,
  to: dateString,
})

export const expenseRoutes = new Hono<AppBindings>()

expenseRoutes.post('/', zValidator('json', createExpenseSchema), async (c) => {
  const body = c.req.valid('json')
  if (!isPositiveAmount(body.amount)) {
    return c.json({ error: 'amount must be a positive number' }, 400)
  }

  try {
    const result = await addExpense(c.get('db'), body)
    return c.json(result, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add expense'
    return c.json({ error: message }, 400)
  }
})

expenseRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { from, to } = c.req.valid('query')
  try {
    const expenses = await listExpenses(c.get('db'), { from, to })
    return c.json({ expenses })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list expenses'
    return c.json({ error: message }, 400)
  }
})

expenseRoutes.patch('/:id', zValidator('json', editExpenseSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  try {
    const result = await editExpense(c.get('db'), id, body)
    return c.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to edit expense'
    const status = message === 'Expense not found' ? 404 : 400
    return c.json({ error: message }, status)
  }
})
