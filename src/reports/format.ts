import { monthLabel } from '../lib/dates'
import type { Verdict } from './monthlyReport'

export type Direction = 'up' | 'down' | 'same'

export const VERDICT_TEXT: Record<Verdict, string> = {
  higher: 'Higher than usual',
  normal: 'Within your normal range',
  lower: 'Lower than usual',
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function dayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function monthName(month: string): string {
  return monthLabel(month).split(' ')[0]
}

export function formatPct(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`
}

export function direction(value: number | null): Direction {
  if (value === null || value === 0) return 'same'
  return value > 0 ? 'up' : 'down'
}
