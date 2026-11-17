import { formatMoney, roundMoney } from '../lib/money'
import type { YearTotal } from '../lib/ledger'
import type { Payment } from '../types'
import { HISTORY_MONTHS, type MonthlyReport, type ReportExpense } from '../reports/monthlyReport'
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
  pendingBalance: number
  upiVpa: string | null
  upiPayeeName: string
}

type Ctx = {
  lang: Lang
  t: Strings
}

const ARROWS: Record<Direction, string> = { up: '&#9650;', down: '&#9660;', same: '' }

const STYLES = `
  :root {
    --ink: #14201f;
    --muted: #3d5552;
    --faint: #6d8581;
    --line: rgba(20, 60, 55, 0.14);
    --accent: #067a72;
    --accent-deep: #045c56;
    --accent-bright: #12a89d;
    --accent-soft: #d8f3ef;
    --coral: #e85d4c;
    --coral-soft: #ffe3de;
    --gold: #c97816;
    --gold-soft: #ffe8c4;
    --up: #c62828;
    --down: #1b8a50;
    --pending: #c97816;
    --paper: #f4faf8;
    --white: #ffffff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--ink);
    font-family: 'Manrope', 'Noto Sans Malayalam', 'Malayalam Sangam MN', sans-serif;
    background:
      radial-gradient(ellipse 90% 55% at 10% -5%, #9fe8de 0%, transparent 55%),
      radial-gradient(ellipse 70% 45% at 100% 5%, #ffd3c4 0%, transparent 50%),
      radial-gradient(ellipse 50% 40% at 80% 100%, #ffe7b0 0%, transparent 45%),
      linear-gradient(180deg, #e7f7f3 0%, var(--paper) 28%, #eef6f4 100%);
    min-height: 100vh;
  }
  main { max-width: 780px; margin: 0 auto; padding: 28px 18px 64px; }
  .hero {
    padding: 22px 22px 26px;
    margin-bottom: 18px;
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(6, 122, 114, 0.95) 0%, #0a9a8f 48%, #2bb3a3 100%);
    color: #fff;
    box-shadow: 0 10px 28px rgba(6, 90, 84, 0.22);
    animation: rise 0.55s ease both;
  }
  .hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .brand {
    font-family: 'Fraunces', 'Noto Serif Malayalam', Georgia, serif;
    font-size: clamp(2.4rem, 7vw, 3.5rem);
    font-weight: 600;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: #fff;
    margin: 0;
  }
  .brand-sub { margin-top: 6px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.82); font-weight: 600; }
  h1 {
    margin: 16px 0 0;
    font-family: 'Fraunces', 'Noto Serif Malayalam', Georgia, serif;
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: #fff;
  }
  .controls { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .lang-toggle {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.16);
  }
  .lang-toggle a {
    padding: 6px 12px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    border-radius: 8px;
  }
  .lang-toggle a.active { background: #fff; color: var(--accent-deep); }
  .lang-toggle a:hover { color: #fff; }
  .lang-toggle a.active:hover { color: var(--accent-deep); }
  .month-form { display: flex; align-items: center; gap: 8px; }
  .month-form .muted { color: rgba(255, 255, 255, 0.85); }
  select {
    font: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: #fff;
    color: var(--ink);
    cursor: pointer;
  }
  .summary {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 14px;
    margin-top: 22px;
  }
  .summary-block {
    min-width: 0;
    padding: 16px 18px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.22);
  }
  .summary-block:last-child {
    background: rgba(255, 232, 196, 0.95);
    border-color: transparent;
  }
  .summary-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.78);
  }
  .summary-block:last-child .summary-label { color: #8a5408; }
  .summary-block .muted { color: rgba(255, 255, 255, 0.82); }
  .summary-block:last-child .muted { color: #8a5408; }
  .total {
    margin-top: 6px;
    font-family: 'Fraunces', 'Noto Serif Malayalam', Georgia, serif;
    font-size: clamp(2.2rem, 5.5vw, 3rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.03em;
    color: #fff;
  }
  .pending-total { color: #9a5410 !important; }
  .upi-meta {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .upi-id {
    font-size: 0.82rem;
    font-weight: 600;
    color: #8a5408;
    word-break: break-all;
  }
  .pay-upi {
    display: none;
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
    border-radius: 8px;
    background: #9a5410;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
  }
  html.is-mobile .pay-upi { display: inline-flex; }
  .pay-upi:hover { background: #7d430c; }
  .panel {
    padding: 22px 20px;
    margin-bottom: 14px;
    border-radius: 16px;
    background: #fff;
    color: var(--ink);
    border: 1px solid rgba(6, 122, 114, 0.14);
    box-shadow: 0 6px 20px rgba(6, 90, 84, 0.08);
    animation: rise 0.6s ease both;
  }
  .panel:nth-of-type(2) { animation-delay: 0.05s; }
  .panel:nth-of-type(3) { animation-delay: 0.1s; }
  .panel:nth-of-type(4) { animation-delay: 0.15s; }
  .section-title {
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-deep);
    margin: 0 0 14px;
    padding: 5px 10px;
    border-radius: 6px;
    background: var(--accent-soft);
  }
  .muted { color: var(--muted); }
  .faint { color: var(--faint); }
  .small { font-size: 0.88rem; }
  .note {
    font-size: 0.88rem;
    color: var(--accent-deep);
    margin: 0 0 14px;
    padding: 12px 14px;
    border-radius: 12px;
    border-left: 4px solid var(--accent);
    background: var(--accent-soft);
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid .panel { margin-bottom: 0; }
  .grid-wrap { margin-bottom: 14px; animation: rise 0.6s ease both; }
  .stat {
    font-family: 'Fraunces', 'Noto Serif Malayalam', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    margin: 8px 0 6px;
    letter-spacing: -0.02em;
  }
  .stat-line { font-size: 0.9rem; line-height: 1.5; color: var(--muted); }
  .up { color: var(--up); }
  .down { color: var(--down); }
  .same { color: var(--muted); }
  .history-row {
    display: grid;
    grid-template-columns: 96px 1fr 108px;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 0.9rem;
    color: var(--muted);
    transition: color 0.15s ease;
  }
  .history-row.current { color: var(--ink); font-weight: 700; }
  .history-row .amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .history-row a { color: inherit; text-decoration: none; }
  .history-row a:hover { color: var(--accent); }
  .track { height: 10px; background: #e4f2ef; border-radius: 999px; overflow: hidden; }
  .fill {
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, #5ec4ba, var(--accent));
    transform-origin: left center;
    animation: grow 0.75s ease both;
  }
  .current .fill { background: linear-gradient(90deg, #f0a35a, var(--coral)); }
  .year-count { margin: -2px 0 8px 106px; font-size: 0.8rem; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 4px; }
  .cycle { margin-top: 22px; }
  .cycle:first-of-type { margin-top: 8px; }
  .cycle-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
  .cycle-title {
    font-family: 'Fraunces', 'Noto Serif Malayalam', Georgia, serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--accent-deep);
  }
  .expenses { width: 100%; border-collapse: collapse; font-size: 0.95rem; margin-top: 6px; }
  .expenses th {
    padding: 10px 10px;
    border-bottom: none;
    color: var(--accent-deep);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: left;
    background: var(--accent-soft);
  }
  .expenses th:first-child { border-radius: 8px 0 0 8px; }
  .expenses th:last-child { border-radius: 0 8px 8px 0; }
  .expenses td { padding: 11px 10px; border-bottom: 1px solid #e8f1ef; color: var(--ink); font-variant-numeric: tabular-nums; }
  .expenses tbody tr { transition: background 0.15s ease; }
  .expenses tbody tr:hover { background: #f3fbf9; }
  .expenses .sno { width: 64px; color: var(--faint); }
  .expenses .num { text-align: right; white-space: nowrap; }
  .expenses tr.highest td { background: var(--coral-soft); }
  .expenses tr.highest .num { color: var(--up); font-weight: 700; }
  .expenses tr.lowest td { background: #e5f7ec; }
  .expenses tr.lowest .num { color: var(--down); font-weight: 700; }
  .badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    vertical-align: 1px;
  }
  .badge.highest { background: var(--coral); color: #fff; }
  .badge.lowest { background: var(--down); color: #fff; }
  .expenses tfoot td {
    border-top: 2px solid var(--accent);
    border-bottom: none;
    font-weight: 800;
    padding-top: 12px;
    color: var(--accent-deep);
  }
  .empty { text-align: center; padding: 28px 0; color: var(--muted); }
  @keyframes rise {
    from { transform: translateY(12px); }
    to { transform: translateY(0); }
  }
  @keyframes grow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero, .panel, .grid-wrap, .fill { animation: none; }
  }
  html[lang="ml"] body { font-family: 'Noto Sans Malayalam', 'Manrope', 'Malayalam Sangam MN', sans-serif; }
  html[lang="ml"] .brand, html[lang="ml"] h1, html[lang="ml"] .total, html[lang="ml"] .stat, html[lang="ml"] .cycle-title {
    font-family: 'Noto Serif Malayalam', 'Fraunces', Georgia, serif;
  }
  html[lang="ml"] .section-title { font-size: 0.9rem; letter-spacing: 0; text-transform: none; }
  html[lang="ml"] .small, html[lang="ml"] .stat-line, html[lang="ml"] .history-row { font-size: 0.95rem; }
  html[lang="ml"] .expenses th { font-size: 0.85rem; letter-spacing: 0; text-transform: none; }
  html[lang="ml"] .badge { font-size: 0.78rem; }
  html[lang="ml"] .note { font-size: 0.9rem; }
  html[lang="ml"] .lang-toggle a { font-size: 0.95rem; }
  @media (max-width: 600px) {
    .summary, .grid { grid-template-columns: 1fr; gap: 12px; }
    .controls { align-items: flex-start; width: 100%; }
    .year-count { margin-left: 0; }
    .hero { padding: 18px 16px 20px; }
    .panel { padding: 18px 14px; }
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
    <form class="month-form" method="get" action="">
      <input type="hidden" name="lang" value="${ctx.lang}">
      <label for="month" class="muted small">${escapeHtml(ctx.t.month)}</label>
      <select id="month" name="month" onchange="this.form.submit()">${options}</select>
      <noscript><button type="submit">${escapeHtml(ctx.t.go)}</button></noscript>
    </form>`
}

function buildUpiPayHref(vpa: string, payeeName: string, amount: number): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: String(roundMoney(amount)),
    cu: 'INR',
  })
  // Target GPay explicitly — generic upi:// often opens WhatsApp or another UPI app.
  return `tez://upi/pay?${params.toString()}`
}

function renderSummary(
  report: MonthlyReport,
  pendingBalance: number,
  inProgress: boolean,
  ctx: Ctx,
  upi: { vpa: string | null; payeeName: string },
): string {
  const details = [ctx.t.expenseCount(report.count)]
  if (report.highestDay) {
    details.push(
      ctx.t.highestDay(
        dayMonthLabel(report.highestDay.date),
        formatMoney(report.highestDay.total),
      ),
    )
  }

  const upiMeta = upi.vpa
    ? `<div class="upi-meta">
        <div class="upi-id">${escapeHtml(upi.vpa)}</div>
        ${
          pendingBalance > 0
            ? `<a class="pay-upi" href="${escapeHtml(buildUpiPayHref(upi.vpa, upi.payeeName, pendingBalance))}">${escapeHtml(ctx.t.payWithUpi)}</a>`
            : ''
        }
      </div>`
    : ''

  return `
  <div class="summary">
    <div class="summary-block">
      <div class="summary-label">${escapeHtml(inProgress ? ctx.t.totalSpentSoFar : ctx.t.totalSpent)}</div>
      <div class="total">${escapeHtml(formatMoney(report.total))}</div>
      <div class="muted small" style="margin-top:10px;">${details.map(escapeHtml).join(' · ')}</div>
    </div>
    <div class="summary-block">
      <div class="summary-label">${escapeHtml(ctx.t.pendingBalance)}</div>
      <div class="total pending-total">${escapeHtml(formatMoney(pendingBalance))}</div>
      ${upiMeta}
    </div>
  </div>`
}

function statCard(label: string, headline: string, tone: Direction, lines: string[]): string {
  return `
    <section class="panel">
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
    <section class="panel">
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
  <div class="grid-wrap">
    <div class="grid">
      <section class="panel">
        <div class="section-title">${escapeHtml(ctx.t.totalTillDate)}</div>
        <div class="total">${escapeHtml(formatMoney(total))}</div>
        <div class="muted small" style="margin-top:8px;">${details.map(escapeHtml).join(' · ')}</div>
      </section>
      <section class="panel">
        <div class="section-title">${escapeHtml(ctx.t.perYear)}</div>
        ${yearRows}
      </section>
    </div>
  </div>`
}

function renderPayments(payments: Payment[], ctx: Ctx): string {
  const { t } = ctx

  if (payments.length === 0) {
    return `
    <section class="panel">
      <div class="section-title">${escapeHtml(t.payments)}</div>
      <div class="empty">${escapeHtml(t.noPayments)}</div>
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
    <section class="panel">
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
    </section>`
}

function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10))
}

function renderExpenseCycle(
  expenses: ReportExpense[],
  cycleNumber: number,
  fromDay: number,
  toDay: number,
  highestDate: string | undefined,
  lowestDate: string | undefined,
  ctx: Ctx,
): string {
  const { t } = ctx
  const total = roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0))
  const title = t.cycle(cycleNumber, fromDay, toDay)

  if (expenses.length === 0) {
    return `
    <div class="cycle">
      <div class="cycle-head">
        <div class="cycle-title">${escapeHtml(title)}</div>
        <div class="faint small">${escapeHtml(t.expenseCount(0))}</div>
      </div>
      <div class="empty" style="padding:20px 0;">${escapeHtml(t.noExpensesInCycle)}</div>
    </div>`
  }

  const rows = expenses
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
    <div class="cycle">
      <div class="cycle-head">
        <div class="cycle-title">${escapeHtml(title)}</div>
        <div class="faint small">${escapeHtml(t.expenseCount(expenses.length))}</div>
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
            <td class="num">${escapeHtml(formatMoney(total))}</td>
          </tr>
        </tfoot>
      </table>
    </div>`
}

function renderExpenses(report: MonthlyReport, ctx: Ctx): string {
  const { t } = ctx
  if (report.count === 0) {
    return `
    <section class="panel">
      <div class="section-title">${escapeHtml(t.expenses)}</div>
      <div class="empty">${escapeHtml(t.noExpenses)}</div>
    </section>`
  }

  const lastDay = report.daily[report.daily.length - 1]?.day ?? 31
  const firstCycle = report.expenses.filter((expense) => dayOfMonth(expense.date) <= 15)
  const secondCycle = report.expenses.filter((expense) => dayOfMonth(expense.date) >= 16)
  const highestDate = report.highestDay?.date
  const lowestDate = report.lowestDay?.date !== highestDate ? report.lowestDay?.date : undefined

  return `
    <section class="panel">
      <div class="section-head">
        <div class="section-title">${escapeHtml(t.expenses)}</div>
        <div class="faint small">${escapeHtml(t.expenseCount(report.count))}</div>
      </div>
      ${renderExpenseCycle(firstCycle, 1, 1, 15, highestDate, lowestDate, ctx)}
      ${renderExpenseCycle(secondCycle, 2, 16, lastDay, highestDate, lowestDate, ctx)}
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

  const brandParts = ctx.t.brand.split('·').map((part) => part.trim())
  const brandName = brandParts[0] ?? 'Radhu'
  const brandTag = brandParts[1] ?? ''

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(ctx.t.pageTitle(monthTitle))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;600&family=Manrope:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Noto+Serif+Malayalam:wght@500;600&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>
<main>
  <header class="hero">
    <div class="hero-top">
      <div>
        <div class="brand">${escapeHtml(brandName)}</div>
        ${brandTag ? `<div class="brand-sub">${escapeHtml(brandTag)}</div>` : ''}
        <h1>${escapeHtml(monthTitle)}</h1>
      </div>
      <div class="controls">
        ${renderLanguageToggle(report.month, ctx)}
        ${renderMonthPicker(input, ctx)}
      </div>
    </div>
    ${renderSummary(report, input.pendingBalance, inProgress, ctx, {
      vpa: input.upiVpa,
      payeeName: input.upiPayeeName,
    })}
  </header>
  ${renderExpenses(report, ctx)}
  <div class="grid-wrap">
    <div class="grid">
      ${renderLastMonthCard(report, ctx)}
      ${renderAverageCard(report, ctx)}
    </div>
  </div>
  ${note}
  ${renderHistory(report, ctx)}
  ${renderAllTime(input, ctx)}
  ${renderPayments(input.payments, ctx)}
</main>
<script>
(function () {
  var ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
    document.documentElement.classList.add('is-mobile');
  }
})();
</script>
</body>
</html>`
}
