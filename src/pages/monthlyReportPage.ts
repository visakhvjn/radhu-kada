import { formatMoney, roundMoney } from '../lib/money'
import type { YearTotal } from '../lib/ledger'
import type { Payment } from '../types'
import { HISTORY_MONTHS, type MonthlyReport } from '../reports/monthlyReport'
import { direction, escapeHtml, formatPct, type Direction } from '../reports/format'
import {
  LANGUAGE_NAMES,
  STRINGS,
  dayMonthLabel,
  fullDateLabel,
  monthNameLabel,
  monthShortLabel,
  monthTitleLabel,
  localWeekday,
  type Lang,
  type Strings,
} from './i18n'

export type MonthlyReportPageInput = {
  report: MonthlyReport
  months: string[]
  currentMonth: string
  lang: Lang
  yearly: YearTotal[]
  firstExpenseDate: string | null
  payments: Payment[]
  balanceDue: number
}

type Ctx = {
  lang: Lang
  t: Strings
}

const ARROWS: Record<Direction, string> = { up: '&#9650;', down: '&#9660;', same: '' }

const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f5f7; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Noto Sans Malayalam', 'Malayalam Sangam MN', sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; padding: 22px 24px; border-radius: 12px; background: linear-gradient(135deg, #4338ca, #6366f1); color: #fff; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25); }
  .brand { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
  h1 { margin: 4px 0 0; font-size: 26px; }
  header .muted { color: rgba(255, 255, 255, 0.85); }
  .controls { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
  .lang-toggle { display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(255, 255, 255, 0.18); }
  .lang-toggle a { padding: 4px 12px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 600; text-decoration: none; }
  .lang-toggle a.active { background: #fff; color: #4338ca; }
  select { font: inherit; font-size: 14px; padding: 8px 12px; border: none; border-radius: 8px; background: #fff; color: #111827; cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
  .card { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .section-title { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; margin: 0 0 12px; }
  .total { font-size: 40px; font-weight: 700; line-height: 1.1; }
  .muted { color: #6b7280; }
  .faint { color: #9ca3af; }
  .small { font-size: 13px; }
  .note { font-size: 12px; color: #6b7280; margin: -4px 0 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .grid .card { margin-bottom: 0; }
  .stat { font-size: 28px; font-weight: 700; margin: 8px 0 6px; }
  .stat-line { font-size: 13px; line-height: 1.5; color: #6b7280; }
  .up { color: #dc2626; }
  .down { color: #16a34a; }
  .same { color: #6b7280; }
  .history-row { display: grid; grid-template-columns: 96px 1fr 100px; align-items: center; gap: 8px; padding: 5px 0; font-size: 13px; color: #6b7280; }
  .history-row.current { color: #111827; font-weight: 700; }
  .history-row .amount { text-align: right; white-space: nowrap; }
  .history-row a { color: inherit; text-decoration: none; }
  .history-row a:hover { text-decoration: underline; }
  .track { height: 10px; }
  .fill { height: 10px; border-radius: 3px; background: #a5b4fc; }
  .current .fill { background: #4f46e5; }
  .year-count { margin: -2px 0 6px; font-size: 12px; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 4px; }
  .expenses { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px; }
  .expenses th { padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; text-align: left; }
  .expenses td { padding: 10px 12px; border-bottom: 1px solid #f0f1f3; }
  .expenses tbody tr:hover { background: #f9fafb; }
  .expenses .sno { width: 72px; color: #9ca3af; }
  .expenses .num { text-align: right; white-space: nowrap; }
  .expenses tr.highest td { background: #fef2f2; }
  .expenses tr.highest .num { color: #dc2626; font-weight: 600; }
  .expenses tr.lowest td { background: #f0fdf4; }
  .expenses tr.lowest .num { color: #16a34a; font-weight: 600; }
  .badge { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; vertical-align: 1px; }
  .badge.highest { background: #fee2e2; color: #b91c1c; }
  .badge.lowest { background: #dcfce7; color: #15803d; }
  .expenses tfoot td { border-top: 2px solid #111827; border-bottom: none; font-weight: 700; }
  .empty { text-align: center; padding: 32px 0; color: #6b7280; }
  html[lang="ml"] .brand { font-size: 14px; }
  html[lang="ml"] .section-title { font-size: 13px; letter-spacing: 0; text-transform: none; }
  html[lang="ml"] .small, html[lang="ml"] .stat-line, html[lang="ml"] .history-row { font-size: 14px; }
  html[lang="ml"] .expenses th { font-size: 13px; }
  html[lang="ml"] .badge { font-size: 12px; }
  html[lang="ml"] .note { font-size: 13px; }
  html[lang="ml"] .lang-toggle a { font-size: 13px; }
  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
    .total { font-size: 34px; }
    .controls { align-items: flex-start; }
  }
`

function pageHref(month: string, lang: Lang): string {
  return `?month=${encodeURIComponent(month)}&lang=${lang}`
}

function renderLanguageToggle(month: string, ctx: Ctx): string {
  const links = (Object.keys(LANGUAGE_NAMES) as Lang[])
    .map((lang) => {
      const active = lang === ctx.lang ? ' class="active"' : ''
      return `<a href="${escapeHtml(pageHref(month, lang))}"${active} lang="${lang}">${escapeHtml(LANGUAGE_NAMES[lang])}</a>`
    })
    .join('')
  return `<nav class="lang-toggle">${links}</nav>`
}

function renderMonthPicker(input: MonthlyReportPageInput, ctx: Ctx): string {
  const options = input.months
    .map((month) => {
      const title = monthTitleLabel(month)
      const label = month === input.currentMonth ? `${title} (${ctx.t.thisMonth})` : title
      const selected = month === input.report.month ? ' selected' : ''
      return `<option value="${escapeHtml(month)}"${selected}>${escapeHtml(label)}</option>`
    })
    .join('')

  return `
    <form method="get" action="">
      <input type="hidden" name="lang" value="${ctx.lang}">
      <label for="month" class="muted small" style="margin-right:6px;">${escapeHtml(ctx.t.month)}</label>
      <select id="month" name="month" onchange="this.form.submit()">${options}</select>
      <noscript><button type="submit">${escapeHtml(ctx.t.go)}</button></noscript>
    </form>`
}

function renderSummary(report: MonthlyReport, inProgress: boolean, ctx: Ctx): string {
  const details = [ctx.t.expenseCount(report.count)]
  if (report.highestDay) {
    details.push(
      ctx.t.highestDay(
        dayMonthLabel(report.highestDay.date),
        formatMoney(report.highestDay.total),
      ),
    )
  }

  return `
    <section class="card">
      <div class="muted small">${escapeHtml(inProgress ? ctx.t.totalSpentSoFar : ctx.t.totalSpent)}</div>
      <div class="total">${escapeHtml(formatMoney(report.total))}</div>
      <div class="muted small" style="margin-top:8px;">${details.map(escapeHtml).join(' &middot; ')}</div>
    </section>`
}

function statCard(label: string, headline: string, tone: Direction, lines: string[]): string {
  return `
    <section class="card">
      <div class="section-title" style="margin:0;">${escapeHtml(label)}</div>
      <div class="stat ${tone}">${headline}</div>
      ${lines.map((line) => `<div class="stat-line">${line}</div>`).join('')}
    </section>`
}

function renderLastMonthCard(report: MonthlyReport, ctx: Ctx): string {
  const previousName = monthNameLabel(report.previousMonth.month)
  const label = ctx.t.vsMonth(previousName)
  const change = report.previousMonth.changePct

  if (change === null) {
    return statCard(label, '&mdash;', 'same', [escapeHtml(ctx.t.noSpendingIn(previousName))])
  }

  const dir = direction(change)
  const headline = dir === 'same' ? escapeHtml(ctx.t.noChange) : `${ARROWS[dir]} ${formatPct(change)}`
  return statCard(label, headline, dir, [
    escapeHtml(ctx.t.spentIn(previousName, formatMoney(report.previousMonth.total))),
  ])
}

function renderAverageCard(report: MonthlyReport, ctx: Ctx): string {
  const { history } = report
  const label = ctx.t.vsAverage(HISTORY_MONTHS)

  if (
    history.insufficientHistory ||
    history.average === null ||
    history.stdDev === null ||
    history.deviationPct === null
  ) {
    return statCard(label, '&mdash;', 'same', [
      escapeHtml(ctx.t.notEnoughHistory(history.monthsWithData)),
    ])
  }

  const dir = direction(history.deviationPct)
  const headline =
    dir === 'same' ? escapeHtml(ctx.t.onAverage) : `${ARROWS[dir]} ${formatPct(history.deviationPct)}`
  const tone: Direction =
    history.verdict === 'higher' ? 'up' : history.verdict === 'lower' ? 'down' : 'same'
  return statCard(label, headline, tone, [
    `<strong class="${tone}">${escapeHtml(ctx.t.verdict[history.verdict ?? 'normal'])}</strong>`,
    escapeHtml(ctx.t.average(formatMoney(Math.round(history.average)))),
    escapeHtml(ctx.t.typicalSwing(formatMoney(Math.round(history.stdDev)))),
  ])
}

function renderHistory(report: MonthlyReport, ctx: Ctx): string {
  const rows = [
    ...report.history.months.map((entry) => ({ ...entry, current: false })),
    { month: report.month, total: report.total, count: report.count, current: true },
  ]
  const max = Math.max(...rows.map((row) => row.total))

  const body = rows
    .map((row) => {
      const pct = max > 0 ? Math.max(1, Math.round((row.total / max) * 100)) : 0
      const barHtml =
        row.count > 0 && pct > 0
          ? `<div class="track"><div class="fill" style="width:${pct}%;"></div></div>`
          : `<span class="faint small">${escapeHtml(ctx.t.noData)}</span>`
      const amount = row.count > 0 ? escapeHtml(formatMoney(row.total)) : '&mdash;'
      const label = escapeHtml(monthShortLabel(row.month))
      return `
        <div class="history-row${row.current ? ' current' : ''}">
          <a href="${escapeHtml(pageHref(row.month, ctx.lang))}">${label}</a>
          ${barHtml}
          <span class="amount">${amount}</span>
        </div>`
    })
    .join('')

  const average = report.history.average
  const footer =
    average === null
      ? ''
      : `<div class="faint small" style="margin-top:8px;">${escapeHtml(ctx.t.averageOfMonths(formatMoney(Math.round(average))))}</div>`

  return `
    <section class="card">
      <div class="section-title">${escapeHtml(ctx.t.lastMonths(HISTORY_MONTHS))}</div>
      ${body}
      ${footer}
    </section>`
}

function renderAllTime(input: MonthlyReportPageInput, ctx: Ctx): string {
  const { yearly, firstExpenseDate, report } = input
  const total = roundMoney(yearly.reduce((sum, year) => sum + year.total, 0))
  const count = yearly.reduce((sum, year) => sum + year.count, 0)
  const details = [ctx.t.expenseCount(count)]
  if (firstExpenseDate) details.push(ctx.t.since(fullDateLabel(firstExpenseDate)))

  const selectedYear = report.month.slice(0, 4)
  const max = Math.max(0, ...yearly.map((year) => year.total))
  const yearRows = yearly.length
    ? yearly
        .map((year) => {
          const pct = max > 0 ? Math.max(1, Math.round((year.total / max) * 100)) : 0
          return `
        <div class="history-row${year.year === selectedYear ? ' current' : ''}">
          <span>${escapeHtml(year.year)}</span>
          <div class="track"><div class="fill" style="width:${pct}%;"></div></div>
          <span class="amount">${escapeHtml(formatMoney(year.total))}</span>
        </div>
        <div class="year-count faint">${escapeHtml(ctx.t.expenseCount(year.count))}</div>`
        })
        .join('')
    : `<div class="faint small">${escapeHtml(ctx.t.noData)}</div>`

  return `
  <div class="grid">
    <section class="card">
      <div class="section-title">${escapeHtml(ctx.t.totalTillDate)}</div>
      <div class="total">${escapeHtml(formatMoney(total))}</div>
      <div class="muted small" style="margin-top:8px;">${details.map(escapeHtml).join(' &middot; ')}</div>
    </section>
    <section class="card">
      <div class="section-title">${escapeHtml(ctx.t.perYear)}</div>
      ${yearRows}
    </section>
  </div>`
}

function renderPayments(payments: Payment[], balanceDue: number, ctx: Ctx): string {
  const { t } = ctx
  const balance = `<div class="muted small" style="margin-top:12px;">${escapeHtml(t.balanceDue(formatMoney(balanceDue)))}</div>`

  if (payments.length === 0) {
    return `
    <section class="card">
      <div class="section-title">${escapeHtml(t.payments)}</div>
      <div class="empty">${escapeHtml(t.noPayments)}</div>
      ${balance}
    </section>`
  }

  const total = roundMoney(payments.reduce((sum, payment) => sum + payment.amount, 0))
  const rows = payments
    .map(
      (payment, index) => `
        <tr>
          <td class="sno">${index + 1}</td>
          <td>${escapeHtml(dayMonthLabel(payment.date))}</td>
          <td>${escapeHtml(localWeekday(payment.date, ctx.lang))}</td>
          <td class="num">${escapeHtml(formatMoney(payment.amount))}</td>
        </tr>`,
    )
    .join('')

  return `
    <section class="card">
      <div class="section-head">
        <div class="section-title">${escapeHtml(t.payments)}</div>
        <div class="faint small">${escapeHtml(t.paymentCount(payments.length))}</div>
      </div>
      <table class="expenses">
        <thead>
          <tr>
            <th class="sno">${escapeHtml(t.sno)}</th>
            <th>${escapeHtml(t.date)}</th>
            <th>${escapeHtml(t.day)}</th>
            <th class="num">${escapeHtml(t.amount)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3">${escapeHtml(t.totalPaid)}</td>
            <td class="num">${escapeHtml(formatMoney(total))}</td>
          </tr>
        </tfoot>
      </table>
      ${balance}
    </section>`
}

function renderExpenses(report: MonthlyReport, ctx: Ctx): string {
  const { t } = ctx
  if (report.count === 0) {
    return `
    <section class="card">
      <div class="section-title">${escapeHtml(t.expenses)}</div>
      <div class="empty">${escapeHtml(t.noExpenses)}</div>
    </section>`
  }

  const highestDate = report.highestDay?.date
  const lowestDate = report.lowestDay?.date !== highestDate ? report.lowestDay?.date : undefined

  const rows = report.expenses
    .map((expense, index) => {
      const mark =
        expense.date === highestDate ? 'highest' : expense.date === lowestDate ? 'lowest' : null
      const badge = mark
        ? `<span class="badge ${mark}">${escapeHtml(mark === 'highest' ? t.highest : t.lowest)}</span>`
        : ''
      return `
        <tr${mark ? ` class="${mark}"` : ''}>
          <td class="sno">${index + 1}</td>
          <td>${escapeHtml(dayMonthLabel(expense.date))}</td>
          <td>${escapeHtml(localWeekday(expense.date, ctx.lang))}${badge}</td>
          <td class="num">${escapeHtml(formatMoney(expense.amount))}</td>
        </tr>`
    })
    .join('')

  return `
    <section class="card">
      <div class="section-head">
        <div class="section-title">${escapeHtml(t.expenses)}</div>
        <div class="faint small">${escapeHtml(t.expenseCount(report.count))}</div>
      </div>
      <table class="expenses">
        <thead>
          <tr>
            <th class="sno">${escapeHtml(t.sno)}</th>
            <th>${escapeHtml(t.date)}</th>
            <th>${escapeHtml(t.day)}</th>
            <th class="num">${escapeHtml(t.amount)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3">${escapeHtml(t.total)}</td>
            <td class="num">${escapeHtml(formatMoney(report.total))}</td>
          </tr>
        </tfoot>
      </table>
    </section>`
}

export function renderMonthlyReportPage(input: MonthlyReportPageInput): string {
  const { report, lang } = input
  const ctx: Ctx = { lang, t: STRINGS[lang] }
  const inProgress = report.month === input.currentMonth
  const monthTitle = monthTitleLabel(report.month)
  const note = inProgress
    ? `<p class="note">${escapeHtml(ctx.t.inProgressNote(monthNameLabel(report.month)))}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(ctx.t.pageTitle(monthTitle))}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
  <header>
    <div>
      <div class="brand">${escapeHtml(ctx.t.brand)}</div>
      <h1>${escapeHtml(monthTitle)}</h1>
    </div>
    <div class="controls">
      ${renderLanguageToggle(report.month, ctx)}
      ${renderMonthPicker(input, ctx)}
    </div>
  </header>
  ${renderSummary(report, inProgress, ctx)}
  ${renderExpenses(report, ctx)}
  <div class="grid">
    ${renderLastMonthCard(report, ctx)}
    ${renderAverageCard(report, ctx)}
  </div>
  ${note}
  ${renderHistory(report, ctx)}
  ${renderAllTime(input, ctx)}
  ${renderPayments(input.payments, input.balanceDue, ctx)}
</main>
</body>
</html>`
}
