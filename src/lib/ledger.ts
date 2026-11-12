import type { Db } from 'mongodb'
import { COLLECTIONS } from '../db/client'
import { generateId } from './ids'
import { isDateString, todayDateString } from './dates'
import { roundMoney } from './money'
import type { Balance, Expense, Payment } from '../types'

const BALANCE_ID = 'current' as const

function publicDoc<T extends { id: string }>(doc: T): T {
  const { _id: _mongoId, ...rest } = doc as T & { _id?: unknown }
  return rest as T
}

export type AddExpenseInput = {
  amount: number
  date?: string
  description?: string
}

export type EditExpenseInput = {
  amount?: number
  date?: string
  description?: string | null
}

export type RecordPaymentInput = {
  amount: number
  date?: string
  note?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function validateDate(date: string | undefined): string {
  const value = date ?? todayDateString()
  if (!isDateString(value)) {
    throw new Error('date must be YYYY-MM-DD')
  }
  return value
}

async function bumpBalance(db: Db, delta: number): Promise<number> {
  const updatedAt = nowIso()
  const result = await db.collection<Balance>(COLLECTIONS.balance).findOneAndUpdate(
    { id: BALANCE_ID },
    {
      $inc: { due: delta },
      $set: { updatedAt },
    },
    { upsert: true, returnDocument: 'after' },
  )

  const due = roundMoney(result?.due ?? delta)
  if (result && result.due !== due) {
    await db.collection<Balance>(COLLECTIONS.balance).updateOne(
      { id: BALANCE_ID },
      { $set: { due, updatedAt } },
    )
  }
  return due
}

export async function getBalanceDue(db: Db): Promise<number> {
  const doc = await db.collection<Balance>(COLLECTIONS.balance).findOne({ id: BALANCE_ID })
  return roundMoney(doc?.due ?? 0)
}

export async function addExpense(db: Db, input: AddExpenseInput): Promise<{
  expense: Expense
  balanceDue: number
}> {
  const amount = roundMoney(input.amount)
  const timestamp = nowIso()
  const expense: Expense = {
    id: generateId('exp'),
    amount,
    date: validateDate(input.date),
    description: input.description?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.collection<Expense>(COLLECTIONS.expenses).insertOne(expense)

  try {
    const balanceDue = await bumpBalance(db, amount)
    return { expense: publicDoc(expense), balanceDue }
  } catch (error) {
    await db.collection(COLLECTIONS.expenses).deleteOne({ id: expense.id })
    throw error
  }
}

export async function listExpenses(
  db: Db,
  range: { from: string; to: string },
): Promise<Expense[]> {
  if (!isDateString(range.from) || !isDateString(range.to)) {
    throw new Error('from and to must be YYYY-MM-DD')
  }
  if (range.from > range.to) {
    throw new Error('from must be on or before to')
  }

  const docs = await db
    .collection<Expense>(COLLECTIONS.expenses)
    .find({ date: { $gte: range.from, $lte: range.to } })
    .sort({ date: 1, createdAt: 1 })
    .toArray()

  return docs.map((doc) => publicDoc(doc))
}

export async function getEarliestExpenseDate(db: Db): Promise<string | null> {
  const doc = await db
    .collection<Expense>(COLLECTIONS.expenses)
    .find({}, { projection: { date: 1 } })
    .sort({ date: 1 })
    .limit(1)
    .next()
  return doc?.date ?? null
}

export type YearTotal = {
  year: string
  total: number
  count: number
}

export async function getYearlyTotals(db: Db): Promise<YearTotal[]> {
  const rows = await db
    .collection<Expense>(COLLECTIONS.expenses)
    .aggregate<{ _id: string; total: number; count: number }>([
      {
        $group: {
          _id: { $substrBytes: ['$date', 0, 4] },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ])
    .toArray()

  return rows.map((row) => ({ year: row._id, total: roundMoney(row.total), count: row.count }))
}

export async function editExpense(
  db: Db,
  id: string,
  input: EditExpenseInput,
): Promise<{ expense: Expense; balanceDue: number }> {
  const existing = await db.collection<Expense>(COLLECTIONS.expenses).findOne({ id })
  if (!existing) {
    throw new Error('Expense not found')
  }

  const nextAmount =
    input.amount === undefined ? existing.amount : roundMoney(input.amount)
  const nextDate =
    input.date === undefined ? existing.date : validateDate(input.date)
  const nextDescription =
    input.description === undefined
      ? existing.description
      : input.description?.trim() || null

  const expense: Expense = {
    ...existing,
    amount: nextAmount,
    date: nextDate,
    description: nextDescription,
    updatedAt: nowIso(),
  }

  await db.collection<Expense>(COLLECTIONS.expenses).replaceOne({ id }, expense)

  const delta = roundMoney(nextAmount - existing.amount)
  const balanceDue = delta === 0 ? await getBalanceDue(db) : await bumpBalance(db, delta)
  return { expense: publicDoc(expense), balanceDue }
}

export async function recordPayment(db: Db, input: RecordPaymentInput): Promise<{
  payment: Payment
  balanceDue: number
}> {
  const amount = roundMoney(input.amount)
  const payment: Payment = {
    id: generateId('pay'),
    amount,
    date: validateDate(input.date),
    note: input.note?.trim() || null,
    createdAt: nowIso(),
  }

  await db.collection<Payment>(COLLECTIONS.payments).insertOne(payment)

  try {
    const balanceDue = await bumpBalance(db, -amount)
    return { payment: publicDoc(payment), balanceDue }
  } catch (error) {
    await db.collection(COLLECTIONS.payments).deleteOne({ id: payment.id })
    throw error
  }
}

export async function listPayments(
  db: Db,
  range: { from: string; to: string },
): Promise<Payment[]> {
  if (!isDateString(range.from) || !isDateString(range.to)) {
    throw new Error('from and to must be YYYY-MM-DD')
  }
  if (range.from > range.to) {
    throw new Error('from must be on or before to')
  }

  const docs = await db
    .collection<Payment>(COLLECTIONS.payments)
    .find({ date: { $gte: range.from, $lte: range.to } })
    .sort({ date: 1, createdAt: 1 })
    .toArray()

  return docs.map((doc) => publicDoc(doc))
}
