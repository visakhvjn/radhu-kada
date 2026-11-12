import { monthLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { HISTORY_MONTHS, type MonthlyReport, type Verdict } from '../reports/monthlyReport'
import {
  VERDICT_TEXT,
  dayLabel,
  direction,
  escapeHtml,
  formatPct,
  monthName,
} from '../reports/format'

export type RenderedEmail = {
  subject: string
  html: string
  text: string
}

const COLORS = {
  page: '#f4f5f7',
  card: '#ffffff',
  panel: '#f9fafb',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  bar: '#a5b4fc',
  barStrong: '#4f46e5',
  up: '#dc2626',
  down: '#16a34a',
  neutral: '#6b7280',
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function trend(value: number | null): { arrow: string; word: string; color: string } {
  const dir = direction(value)
  if (dir === 'same') return { arrow: '', word: 'same', color: COLORS.neutral }
  return dir === 'up'
    ? { arrow: '&#9650;', word: 'up', color: COLORS.up }
    : { arrow: '&#9660;', word: 'down', color: COLORS.down }
}

function verdictColor(verdict: Verdict | null): string {
  if (verdict === 'higher') return COLORS.up
  if (verdict === 'lower') return COLORS.down
  return COLORS.neutral
}

function buildSubject(report: MonthlyReport): string {
  const base = `Your ${monthLabel(report.month)} expenses: ${formatMoney(report.total)}`
  const change = report.previousMonth.changePct
  if (change === null) return base
  const rounded = Math.round(Math.abs(change))
  if (rounded === 0) return `${base} (about the same as last month)`
  return `${base} (${change > 0 ? 'up' : 'down'} ${rounded}% from last month)`
}

function buildPreheader(report: MonthlyReport): string {
  const parts = [`Total ${formatMoney(report.total)} across ${report.count} expenses.`]
  const change = report.previousMonth.changePct
  if (change !== null) {
    const { word } = trend(change)
    parts.push(
      word === 'same'
        ? `Same as ${monthName(report.previousMonth.month)}.`
        : `${word === 'up' ? 'Up' : 'Down'} ${formatPct(change)} from ${monthName(report.previousMonth.month)}.`,
    )
  }
  return parts.join(' ')
}

function sectionTitle(title: string): string {
  return `<div style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.muted};margin:0 0 12px;">${escapeHtml(title)}</div>`
}

function renderTotalCard(report: MonthlyReport): string {
  const details = [`${report.count} ${report.count === 1 ? 'expense' : 'expenses'}`]
  if (report.highestDay) {
    details.push(
      `Highest day: ${dayLabel(report.highestDay.date)} (${formatMoney(report.highestDay.total)})`,
    )
  }

  return `
    <tr><td style="padding:0 32px 24px;">
      <div style="font-size:13px;color:${COLORS.muted};margin:0 0 4px;">Total spent</div>
      <div style="font-size:40px;line-height:1.1;font-weight:700;color:${COLORS.text};">${escapeHtml(formatMoney(report.total))}</div>
      <div style="font-size:13px;color:${COLORS.muted};margin-top:8px;">${details.map(escapeHtml).join(' &middot; ')}</div>
    </td></tr>`
}

function renderExpenseList(report: MonthlyReport): string {
  if (report.count === 0) {
    return `
    <tr><td style="padding:0 32px 24px;">
      ${sectionTitle('Expenses')}
      <div style="background-color:${COLORS.panel};border-radius:8px;padding:32px;text-align:center;font-size:14px;color:${COLORS.muted};">No expenses recorded this month.</div>
    </td></tr>`
  }

  const cell = `padding:8px 0;font-size:13px;line-height:1.4;vertical-align:top;`
  const rows = report.expenses
    .map((expense, index) => {
      const firstOfDay = index === 0 || report.expenses[index - 1].date !== expense.date
      const border = firstOfDay && index > 0 ? `border-top:1px solid ${COLORS.border};` : ''
      const date = firstOfDay ? escapeHtml(dayLabel(expense.date)) : ''
      const description = expense.description
        ? `<span style="color:${COLORS.text};">${escapeHtml(expense.description)}</span>`
        : `<span style="color:${COLORS.faint};">No description</span>`
      return `
        <tr>
          <td width="64" style="${cell}${border}width:64px;color:${COLORS.muted};white-space:nowrap;">${date}</td>
          <td style="${cell}${border}padding-right:12px;">${description}</td>
          <td width="96" align="right" style="${cell}${border}width:96px;color:${COLORS.text};white-space:nowrap;">${escapeHtml(formatMoney(expense.amount))}</td>
        </tr>`
    })
    .join('')

  return `
    <tr><td style="padding:0 32px 24px;">
      ${sectionTitle('Expenses')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
        <tr>
          <td colspan="2" style="padding:10px 0 0;border-top:2px solid ${COLORS.text};font-size:13px;font-weight:700;color:${COLORS.text};">Total</td>
          <td align="right" style="padding:10px 0 0;border-top:2px solid ${COLORS.text};font-size:13px;font-weight:700;color:${COLORS.text};white-space:nowrap;">${escapeHtml(formatMoney(report.total))}</td>
        </tr>
      </table>
    </td></tr>`
}

function statCard(label: string, headline: string, color: string, lines: string[]): string {
  return `
    <td valign="top" width="48%" style="width:48%;vertical-align:top;background-color:${COLORS.panel};border-radius:8px;padding:16px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(label)}</div>
      <div style="font-size:26px;line-height:1.2;font-weight:700;color:${color};margin:8px 0 6px;">${headline}</div>
      ${lines.map((line) => `<div style="font-size:12px;line-height:1.5;color:${COLORS.muted};">${line}</div>`).join('')}
    </td>`
}

function renderLastMonthCard(report: MonthlyReport): string {
  const previousName = monthName(report.previousMonth.month)
  const label = `vs ${previousName}`
  const change = report.previousMonth.changePct

  if (change === null) {
    return statCard(label, '&mdash;', COLORS.neutral, [
      escapeHtml(`No spending recorded in ${previousName}`),
    ])
  }

  const { arrow, word, color } = trend(change)
  const headline = word === 'same' ? 'No change' : `${arrow} ${formatPct(change)}`
  return statCard(label, headline, color, [
    escapeHtml(`${formatMoney(report.previousMonth.total)} in ${previousName}`),
  ])
}

function renderAverageCard(report: MonthlyReport): string {
  const { history } = report
  const label = `vs ${HISTORY_MONTHS}-month average`

  if (
    history.insufficientHistory ||
    history.average === null ||
    history.stdDev === null ||
    history.deviationPct === null
  ) {
    return statCard(label, '&mdash;', COLORS.neutral, [
      escapeHtml(
        `Not enough history yet (needs 2 months with spending, found ${history.monthsWithData})`,
      ),
    ])
  }

  const { arrow, word } = trend(history.deviationPct)
  const headline = word === 'same' ? 'On average' : `${arrow} ${formatPct(history.deviationPct)}`
  const color = verdictColor(history.verdict)
  return statCard(label, headline, color, [
    `<strong style="color:${color};">${escapeHtml(VERDICT_TEXT[history.verdict ?? 'normal'])}</strong>`,
    escapeHtml(`Average ${formatMoney(Math.round(history.average))}`),
    escapeHtml(`Typical swing ±${formatMoney(Math.round(history.stdDev))} (std dev)`),
  ])
}

function renderComparison(report: MonthlyReport): string {
  return `
    <tr><td style="padding:0 32px 24px;">
      ${sectionTitle('How this month compares')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${renderLastMonthCard(report)}
          <td width="4%" style="width:4%;font-size:0;line-height:0;">&nbsp;</td>
          ${renderAverageCard(report)}
        </tr>
      </table>
    </td></tr>`
}

function renderHistory(report: MonthlyReport): string {
  const rows = [
    ...report.history.months.map((entry) => ({ ...entry, current: false })),
    { month: report.month, total: report.total, count: report.count, current: true },
  ]
  const max = Math.max(...rows.map((row) => row.total))

  const body = rows
    .map((row) => {
      const weight = row.current ? '700' : '400'
      const textColor = row.current ? COLORS.text : COLORS.muted
      const pct = max > 0 ? Math.max(1, Math.round((row.total / max) * 100)) : 0
      const barHtml =
        row.count > 0 && pct > 0
          ? `<table role="presentation" width="${pct}%" cellpadding="0" cellspacing="0" border="0"><tr><td height="10" style="height:10px;background-color:${row.current ? COLORS.barStrong : COLORS.bar};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
          : `<span style="font-size:11px;color:${COLORS.faint};">No data</span>`
      const amount = row.count > 0 ? escapeHtml(formatMoney(row.total)) : '&mdash;'
      return `
        <tr>
          <td width="76" style="width:76px;padding:4px 8px 4px 0;font-size:12px;font-weight:${weight};color:${textColor};white-space:nowrap;">${escapeHtml(monthLabel(row.month, 'short'))}</td>
          <td style="padding:4px 0;vertical-align:middle;">${barHtml}</td>
          <td width="96" align="right" style="width:96px;padding:4px 0 4px 8px;font-size:12px;font-weight:${weight};color:${textColor};white-space:nowrap;">${amount}</td>
        </tr>`
    })
    .join('')

  const average = report.history.average
  const footer =
    average === null
      ? ''
      : `<div style="font-size:11px;color:${COLORS.faint};margin-top:8px;">Average of months with spending: ${escapeHtml(formatMoney(Math.round(average)))}</div>`

  return `
    <tr><td style="padding:0 32px 32px;">
      ${sectionTitle(`Last ${HISTORY_MONTHS} months`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">${body}</table>
      ${footer}
    </td></tr>`
}

function renderHtml(report: MonthlyReport, subject: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(buildPreheader(report))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${COLORS.card};border-radius:12px;font-family:${FONT};color:${COLORS.text};">
      <tr><td style="padding:32px 32px 8px;">
        <div style="font-size:13px;font-weight:600;color:${COLORS.barStrong};">Radhu &middot; Monthly summary</div>
        <h1 style="margin:6px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:${COLORS.text};">${escapeHtml(monthLabel(report.month))}</h1>
      </td></tr>
      <tr><td style="padding:16px 32px 0;"></td></tr>
      ${renderTotalCard(report)}
      ${renderExpenseList(report)}
      ${renderComparison(report)}
      ${renderHistory(report)}
    </table>
    <div style="font-family:${FONT};font-size:11px;color:${COLORS.faint};margin-top:16px;">Sent by Radhu on the 1st of every month.</div>
  </td></tr>
</table>
</body>
</html>`
}

function renderText(report: MonthlyReport, subject: string): string {
  const lines: string[] = [subject, '']
  const previousName = monthName(report.previousMonth.month)

  lines.push(`Total: ${formatMoney(report.total)} (${report.count} expenses)`)
  if (report.highestDay) {
    lines.push(
      `Highest day: ${dayLabel(report.highestDay.date)} (${formatMoney(report.highestDay.total)})`,
    )
  }
  lines.push('')

  const change = report.previousMonth.changePct
  if (change === null) {
    lines.push(`vs ${previousName}: no spending recorded in ${previousName}`)
  } else {
    const { word } = trend(change)
    const summary = word === 'same' ? 'no change' : `${word} ${formatPct(change)}`
    lines.push(`vs ${previousName}: ${summary} (${formatMoney(report.previousMonth.total)})`)
  }

  const { history } = report
  if (history.insufficientHistory || history.average === null || history.deviationPct === null) {
    lines.push(`vs ${HISTORY_MONTHS}-month average: not enough history yet`)
  } else {
    const { word } = trend(history.deviationPct)
    const summary = word === 'same' ? 'on average' : `${word} ${formatPct(history.deviationPct)}`
    lines.push(
      `vs ${HISTORY_MONTHS}-month average: ${summary} - ${VERDICT_TEXT[history.verdict ?? 'normal']}`,
    )
    lines.push(
      `  Average ${formatMoney(Math.round(history.average))}, standard deviation ${formatMoney(Math.round(history.stdDev ?? 0))}`,
    )
  }
  lines.push('', 'Expenses:')
  if (report.expenses.length === 0) {
    lines.push('  No expenses recorded this month.')
  }
  for (const expense of report.expenses) {
    lines.push(
      `  ${dayLabel(expense.date)}  ${formatMoney(expense.amount)}  ${expense.description ?? ''}`.trimEnd(),
    )
  }

  lines.push('', `Last ${HISTORY_MONTHS} months:`)

  for (const entry of history.months) {
    lines.push(`  ${monthLabel(entry.month, 'short')}: ${entry.count > 0 ? formatMoney(entry.total) : 'no data'}`)
  }
  lines.push(`  ${monthLabel(report.month, 'short')}: ${formatMoney(report.total)} (this month)`)

  return lines.join('\n')
}

export function renderMonthlyReportEmail(report: MonthlyReport): RenderedEmail {
  const subject = buildSubject(report)
  return {
    subject,
    html: renderHtml(report, subject),
    text: renderText(report, subject),
  }
}
