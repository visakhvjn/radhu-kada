const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

export function todayDateString(): string {
  const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function isDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isMonthString(value: string): boolean {
  if (!MONTH_RE.test(value)) return false
  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12
}

function parseMonth(month: string): { year: number; month: number } {
  if (!isMonthString(month)) {
    throw new Error('month must be YYYY-MM')
  }
  return { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) }
}

function formatMonth(year: number, month: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

export function shiftMonth(month: string, delta: number): string {
  const parsed = parseMonth(month)
  const index = parsed.year * 12 + (parsed.month - 1) + delta
  return formatMonth(Math.floor(index / 12), (index % 12) + 1)
}

export function currentMonthString(): string {
  return todayDateString().slice(0, 7)
}

export function previousMonthString(): string {
  return shiftMonth(currentMonthString(), -1)
}

export function daysInMonth(month: string): number {
  const parsed = parseMonth(month)
  return new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate()
}

export function monthRange(month: string): { from: string; to: string } {
  const lastDay = String(daysInMonth(month)).padStart(2, '0')
  return { from: `${month}-01`, to: `${month}-${lastDay}` }
}

export function monthLabel(month: string, style: 'long' | 'short' = 'long'): string {
  const parsed = parseMonth(month)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: style,
    year: 'numeric',
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)))
}
