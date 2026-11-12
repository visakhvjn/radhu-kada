import type { Db } from 'mongodb'
import { listExpenses } from '../lib/ledger'
import { daysInMonth, monthRange, shiftMonth } from '../lib/dates'
import { roundMoney } from '../lib/money'
import type { Expense } from '../types'

export const HISTORY_MONTHS = 6

export type DailyTotal = {
  date: string
  day: number
  total: number
}

export type ReportExpense = {
  date: string
  description: string | null
  amount: number
}

export type MonthTotal = {
  month: string
  total: number
  count: number
}

export type Verdict = 'higher' | 'normal' | 'lower'

export type MonthlyReport = {
  month: string
  total: number
  count: number
  expenses: ReportExpense[]
  daily: DailyTotal[]
  highestDay: DailyTotal | null
  lowestDay: DailyTotal | null
  previousMonth: {
    month: string
    total: number
    changePct: number | null
  }
  history: {
    months: MonthTotal[]
    monthsWithData: number
    insufficientHistory: boolean
    average: number | null
    stdDev: number | null
    deviationPct: number | null
    verdict: Verdict | null
  }
}

function percentChange(current: number, base: number): number | null {
  if (base === 0) return null
  return Math.round(((current - base) / base) * 1000) / 10
}

function totalFor(expenses: Expense[]): number {
  return roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0))
}

export function computeMonthlyReport(month: string, expenses: Expense[]): MonthlyReport {
  const byMonth = new Map<string, Expense[]>()
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7)
    const bucket = byMonth.get(key)
    if (bucket) bucket.push(expense)
    else byMonth.set(key, [expense])
  }

  const current = byMonth.get(month) ?? []
  const total = totalFor(current)

  const dailyTotals = new Map<string, number>()
  for (const expense of current) {
    dailyTotals.set(expense.date, (dailyTotals.get(expense.date) ?? 0) + expense.amount)
  }

  const daily: DailyTotal[] = []
  for (let day = 1; day <= daysInMonth(month); day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    daily.push({ date, day, total: roundMoney(dailyTotals.get(date) ?? 0) })
  }

  const highestDay = daily.reduce<DailyTotal | null>(
    (best, entry) => (entry.total > 0 && (!best || entry.total > best.total) ? entry : best),
    null,
  )

  const lowestDay = daily.reduce<DailyTotal | null>(
    (best, entry) => (entry.total > 0 && (!best || entry.total < best.total) ? entry : best),
    null,
  )

  const historyMonths: MonthTotal[] = []
  for (let offset = HISTORY_MONTHS; offset >= 1; offset--) {
    const key = shiftMonth(month, -offset)
    const monthExpenses = byMonth.get(key) ?? []
    historyMonths.push({ month: key, total: totalFor(monthExpenses), count: monthExpenses.length })
  }

  const previous = historyMonths[historyMonths.length - 1]

  const withData = historyMonths.filter((entry) => entry.count > 0)
  const insufficientHistory = withData.length < 2

  let average: number | null = null
  let stdDev: number | null = null
  let deviationPct: number | null = null
  let verdict: Verdict | null = null

  if (!insufficientHistory) {
    const mean = withData.reduce((sum, entry) => sum + entry.total, 0) / withData.length
    const variance =
      withData.reduce((sum, entry) => sum + (entry.total - mean) ** 2, 0) / withData.length
    average = roundMoney(mean)
    stdDev = roundMoney(Math.sqrt(variance))
    deviationPct = percentChange(total, mean)

    // A floor of 5% of the average keeps near-identical history from flagging tiny changes.
    const threshold = Math.max(Math.sqrt(variance), mean * 0.05)
    if (total > mean + threshold) verdict = 'higher'
    else if (total < mean - threshold) verdict = 'lower'
    else verdict = 'normal'
  }

  return {
    month,
    total,
    count: current.length,
    expenses: current.map(({ date, description, amount }) => ({ date, description, amount })),
    daily,
    highestDay,
    lowestDay,
    previousMonth: {
      month: previous.month,
      total: previous.total,
      changePct: percentChange(total, previous.total),
    },
    history: {
      months: historyMonths,
      monthsWithData: withData.length,
      insufficientHistory,
      average,
      stdDev,
      deviationPct,
      verdict,
    },
  }
}

export async function buildMonthlyReport(db: Db, month: string): Promise<MonthlyReport> {
  const from = monthRange(shiftMonth(month, -HISTORY_MONTHS)).from
  const { to } = monthRange(month)
  const expenses = await listExpenses(db, { from, to })
  return computeMonthlyReport(month, expenses)
}
