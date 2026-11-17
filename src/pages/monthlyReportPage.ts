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
    --ink: #202124;
    --muted: #5f6368;
    --faint: #80868b;
    --line: #e8eaed;
    --accent: #1a73e8;
    --accent-deep: #174ea6;
    --accent-soft: #e8f0fe;
    --surface: #ffffff;
    --paper: #f1f3f4;
    --up: #d93025;
    --up-soft: #fce8e6;
    --down: #188038;
    --down-soft: #e6f4ea;
    --pending: #e37400;
    --pending-soft: #fef7e0;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--ink);
    font-family: 'Outfit', 'Noto Sans Malayalam', 'Malayalam Sangam MN', sans-serif;
    background:
      radial-gradient(ellipse 80% 50% at 0% 0%, rgba(26, 115, 232, 0.12), transparent 55%),
      radial-gradient(ellipse 60% 40% at 100% 0%, rgba(66, 133, 244, 0.08), transparent 50%),
      linear-gradient(180deg, #e8f0fe 0%, var(--paper) 32%, #f8f9fa 100%);
    min-height: 100vh;
  }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 72px; }
  .hero {
    position: relative;
    overflow: hidden;
    padding: 28px 24px 24px;
    margin-bottom: 16px;
    border-radius: 24px;
    background:
      linear-gradient(145deg, #1a73e8 0%, #1967d2 42%, #174ea6 100%);
    color: #fff;
    animation: rise 0.55s ease both;
  }
  .hero::after {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    right: -60px;
    top: -70px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }
  .hero-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .brand {
    font-family: 'Outfit', 'Noto Sans Malayalam', sans-serif;
    font-size: clamp(2.5rem, 8vw, 3.6rem);
    font-weight: 700;
    line-height: 0.95;
    letter-spacing: -0.04em;
    color: #fff;
    margin: 0;
  }
  .brand-sub {
    margin-top: 8px;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
  }
  h1 {
    margin: 18px 0 0;
    font-family: 'Outfit', 'Noto Sans Malayalam', sans-serif;
    font-size: clamp(1.35rem, 3.5vw, 1.7rem);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.95);
  }
  .controls { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .lang-toggle {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.16);
  }
  .lang-toggle a {
    padding: 6px 12px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: 16px;
  }
  .lang-toggle a.active { background: #fff; color: var(--accent-deep); }
  .lang-toggle a:hover { color: #fff; }
  .lang-toggle a.active:hover { color: var(--accent-deep); }
  .month-form { display: flex; align-items: center; gap: 8px; }
  .month-form .muted { color: rgba(255, 255, 255, 0.85); }
  select {
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 12px;
    border: none;
    border-radius: 20px;
    background: #fff;
    color: var(--ink);
    cursor: pointer;
  }
  .summary {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 12px;
    margin-top: 24px;
  }
  .summary-block {
    min-width: 0;
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
  }
  .summary-block:last-child {
    background: #fff;
    border-color: transparent;
    color: var(--ink);
  }
  .summary-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
  }
  .summary-block:last-child .summary-label { color: var(--pending); }
  .summary-block .muted { color: rgba(255, 255, 255, 0.8); }
  .summary-block:last-child .muted { color: var(--muted); }
  .total {
    margin-top: 8px;
    font-family: 'Outfit', 'Noto Sans Malayalam', sans-serif;
    font-size: clamp(2rem, 5.5vw, 2.75rem);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.03em;
    color: #fff;
  }
  .pending-total { color: var(--ink) !important; }
  .upi-meta {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .upi-id {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    word-break: break-all;
  }
  .pay-upi {
    display: none;
    align-items: center;
    justify-content: center;
    padding: 10px 18px;
    border-radius: 24px;
    background: var(--accent);
    color: #fff;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.01em;
  }
  html.is-mobile .pay-upi { display: inline-flex; }
  .pay-upi:hover { background: var(--accent-deep); }
  .panel {
    padding: 20px 20px;
    margin-bottom: 12px;
    border-radius: 20px;
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--line);
    animation: rise 0.55s ease both;
  }
  .panel:nth-of-type(2) { animation-delay: 0.04s; }
  .panel:nth-of-type(3) { animation-delay: 0.08s; }
  .panel:nth-of-type(4) { animation-delay: 0.12s; }
  .section-title {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent-deep);
    margin: 0 0 14px;
  }
  .muted { color: var(--muted); }
  .faint { color: var(--faint); }
  .small { font-size: 0.88rem; }
  .note {
    font-size: 0.88rem;
    color: var(--accent-deep);
    margin: 0 0 12px;
    padding: 12px 14px;
    border-radius: 16px;
    background: var(--accent-soft);
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid .panel { margin-bottom: 0; }
  .grid-wrap { margin-bottom: 12px; animation: rise 0.55s ease both; }
  .stat {
    font-family: 'Outfit', 'Noto Sans Malayalam', sans-serif;
    font-size: 1.85rem;
    font-weight: 700;
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
    padding: 9px 0;
    font-size: 0.9rem;
    color: var(--muted);
    border-bottom: 1px solid var(--line);
  }
  .history-row:last-of-type { border-bottom: none; }
  .history-row.current { color: var(--ink); font-weight: 700; }
  .history-row .amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .history-row a { color: inherit; text-decoration: none; }
  .history-row a:hover { color: var(--accent); }
  .track { height: 8px; background: #e8eaed; border-radius: 8px; overflow: hidden; }
  .fill {
    height: 8px;
    border-radius: 8px;
    background: var(--accent);
    transform-origin: left center;
    animation: grow 0.75s ease both;
  }
  .current .fill { background: #34a853; }
  .year-count { margin: -2px 0 8px 106px; font-size: 0.8rem; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 4px; }
  .cycle { margin-top: 22px; }
  .cycle:first-of-type { margin-top: 8px; }
  .cycle-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
  .cycle-title {
    font-family: 'Outfit', 'Noto Sans Malayalam', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ink);
  }
  .expenses { width: 100%; border-collapse: collapse; font-size: 0.94rem; margin-top: 6px; }
  .expenses th {
    padding: 10px 10px;
    border-bottom: none;
    color: var(--accent-deep);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    text-align: left;
    background: var(--accent-soft);
  }
  .expenses th:first-child { border-radius: 10px 0 0 10px; }
  .expenses th:last-child { border-radius: 0 10px 10px 0; }
  .expenses td {
    padding: 12px 10px;
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .expenses tbody tr { transition: background 0.15s ease; }
  .expenses tbody tr:hover { background: #f8f9fa; }
  .expenses .sno { width: 64px; color: var(--faint); }
  .expenses .num { text-align: right; white-space: nowrap; }
  .expenses tr.highest td { background: var(--up-soft); }
  .expenses tr.highest .num { color: var(--up); font-weight: 700; }
  .expenses tr.lowest td { background: var(--down-soft); }
  .expenses tr.lowest .num { color: var(--down); font-weight: 700; }
  .badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    vertical-align: 1px;
  }
  .badge.highest { background: var(--up); color: #fff; }
  .badge.lowest { background: var(--down); color: #fff; }
  .expenses tfoot td {
    border-top: 2px solid var(--accent);
    border-bottom: none;
    font-weight: 700;
    padding-top: 12px;
    color: var(--ink);
  }
  .empty { text-align: center; padding: 28px 0; color: var(--muted); }
  @keyframes rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes grow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero, .panel, .grid-wrap, .fill { animation: none; }
  }
  html[lang="ml"] body { font-family: 'Noto Sans Malayalam', 'Outfit', 'Malayalam Sangam MN', sans-serif; }
  html[lang="ml"] .brand, html[lang="ml"] h1, html[lang="ml"] .total, html[lang="ml"] .stat, html[lang="ml"] .cycle-title {
    font-family: 'Noto Sans Malayalam', 'Outfit', sans-serif;
  }
  html[lang="ml"] .section-title { font-size: 0.9rem; letter-spacing: 0; text-transform: none; }
  html[lang="ml"] .small, html[lang="ml"] .stat-line, html[lang="ml"] .history-row { font-size: 0.95rem; }
  html[lang="ml"] .expenses th { font-size: 0.85rem; letter-spacing: 0; text-transform: none; }
  html[lang="ml"] .badge { font-size: 0.78rem; }
  html[lang="ml"] .note { font-size: 0.9rem; }
  html[lang="ml"] .lang-toggle a { font-size: 0.95rem; }
  @media (max-width: 600px) {
    .summary, .grid { grid-template-columns: 1fr; gap: 10px; }
    .controls { align-items: flex-start; width: 100%; }
    .year-count { margin-left: 0; }
    .hero { padding: 22px 16px 18px; border-radius: 20px; }
    .panel { padding: 16px 14px; border-radius: 16px; }
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
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap" rel="stylesheet">
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
