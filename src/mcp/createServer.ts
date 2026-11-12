import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getDb } from '../db/client'
import {
  addExpense,
  editExpense,
  getBalanceDue,
  listExpenses,
  listPayments,
  recordPayment,
} from '../lib/ledger'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date as YYYY-MM-DD')

function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  }
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed'
  console.error(message)
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true as const,
  }
}

export function createRadhuMcpServer() {
  const server = new McpServer({
    name: 'radhu',
    version: '0.1.0',
  })

  server.registerTool(
    'add_expense',
    {
      title: 'Add expense',
      description:
        'Add an expense. Amount is required. Date defaults to today. This increases the balance due.',
      inputSchema: {
        amount: z.number().positive().describe('Expense amount'),
        date: dateString.optional(),
        description: z.string().max(500).optional().describe('Optional note for the expense'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ amount, date, description }) => {
      try {
        const db = await getDb()
        return ok(await addExpense(db, { amount, date, description }))
      } catch (error) {
        return fail(error)
      }
    },
  )

  server.registerTool(
    'list_expenses',
    {
      title: 'List expenses',
      description: 'Get expenses in an inclusive date range (YYYY-MM-DD).',
      inputSchema: {
        from: dateString.describe('Start date, inclusive'),
        to: dateString.describe('End date, inclusive'),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ from, to }) => {
      try {
        const db = await getDb()
        return ok({ expenses: await listExpenses(db, { from, to }) })
      } catch (error) {
        return fail(error)
      }
    },
  )

  server.registerTool(
    'edit_expense',
    {
      title: 'Edit expense',
      description:
        'Update an expense by id. If amount changes, the balance due is adjusted by the difference.',
      inputSchema: {
        id: z.string().min(1).describe('Expense id, e.g. exp_...'),
        amount: z.number().positive().optional(),
        date: dateString.optional(),
        description: z.string().max(500).nullable().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, amount, date, description }) => {
      try {
        const db = await getDb()
        return ok(await editExpense(db, id, { amount, date, description }))
      } catch (error) {
        return fail(error)
      }
    },
  )

  server.registerTool(
    'record_payment',
    {
      title: 'Record payment',
      description:
        'Record a payment. Amount is required. Date defaults to today. This reduces the balance due.',
      inputSchema: {
        amount: z.number().positive().describe('Payment amount'),
        date: dateString.optional(),
        note: z.string().max(500).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ amount, date, note }) => {
      try {
        const db = await getDb()
        return ok(await recordPayment(db, { amount, date, note }))
      } catch (error) {
        return fail(error)
      }
    },
  )

  server.registerTool(
    'list_payments',
    {
      title: 'List payments',
      description: 'Get payments in an inclusive date range (YYYY-MM-DD).',
      inputSchema: {
        from: dateString.describe('Start date, inclusive'),
        to: dateString.describe('End date, inclusive'),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ from, to }) => {
      try {
        const db = await getDb()
        return ok({ payments: await listPayments(db, { from, to }) })
      } catch (error) {
        return fail(error)
      }
    },
  )

  server.registerTool(
    'get_balance',
    {
      title: 'Get balance due',
      description: 'Get the current balance due (sum of expenses minus payments).',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const db = await getDb()
        return ok({ balanceDue: await getBalanceDue(db) })
      } catch (error) {
        return fail(error)
      }
    },
  )

  return server
}
