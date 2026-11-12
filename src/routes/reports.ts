import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AppBindings } from '../types/hono'
import { currentMonthString, isMonthString, monthRange, shiftMonth } from '../lib/dates'
import {
  getBalanceDue,
  getEarliestExpenseDate,
  getYearlyTotals,
  listPayments,
} from '../lib/ledger'
import { buildMonthlyReport } from '../reports/monthlyReport'
import { renderMonthlyReportEmail } from '../email/monthlyReportTemplate'
import { renderMonthlyReportPage } from '../pages/monthlyReportPage'
import { DEFAULT_LANG, isLang } from '../pages/i18n'

const monthlyQuerySchema = z.object({
  month: z
    .string()
    .refine(isMonthString, 'month must be YYYY-MM')
    .optional(),
  format: z.enum(['html', 'json', 'email']).optional(),
  lang: z.enum(['ml', 'en']).optional(),
})

const LANG_COOKIE = 'radhu_lang'

function monthOptions(currentMonth: string, earliestMonth: string, selected: string): string[] {
  const months: string[] = []
  for (let month = currentMonth; month >= earliestMonth; month = shiftMonth(month, -1)) {
    months.push(month)
  }
  if (!months.includes(selected)) {
    months.push(selected)
    months.sort().reverse()
  }
  return months
}

export const reportRoutes = new Hono<AppBindings>()

reportRoutes.get('/monthly', zValidator('query', monthlyQuerySchema), async (c) => {
  const currentMonth = currentMonthString()
  const { month = currentMonth, format = 'html', lang: langParam } = c.req.valid('query')
  const db = c.get('db')
  const report = await buildMonthlyReport(db, month)

  if (format === 'json') {
    return c.json({ report })
  }

  if (format === 'email') {
    return c.html(renderMonthlyReportEmail(report).html)
  }

  const [earliestDate, yearly, payments, balanceDue] = await Promise.all([
    getEarliestExpenseDate(db),
    getYearlyTotals(db),
    listPayments(db, monthRange(month)),
    getBalanceDue(db),
  ])
  const earliestMonth = earliestDate ? earliestDate.slice(0, 7) : currentMonth
  const months = monthOptions(currentMonth, earliestMonth, month)

  const cookieLang = getCookie(c, LANG_COOKIE)
  const lang = langParam ?? (isLang(cookieLang) ? cookieLang : DEFAULT_LANG)
  if (langParam) {
    setCookie(c, LANG_COOKIE, langParam, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' })
  }

  return c.html(
    renderMonthlyReportPage({
      report,
      months,
      currentMonth,
      lang,
      yearly,
      firstExpenseDate: earliestDate,
      payments,
      balanceDue,
    }),
  )
})
