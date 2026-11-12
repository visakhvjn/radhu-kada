export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatMoney(value: number): string {
  const currency = process.env.APP_CURRENCY || 'INR'
  const fractionDigits = Number.isInteger(value) ? 0 : 2
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function isPositiveAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
