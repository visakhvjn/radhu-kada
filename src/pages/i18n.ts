import type { Verdict } from '../reports/monthlyReport'

export type Lang = 'ml' | 'en'

export const DEFAULT_LANG: Lang = 'ml'

export const LANGUAGE_NAMES: Record<Lang, string> = {
  ml: 'മലയാളം',
  en: 'English',
}

export function isLang(value: unknown): value is Lang {
  return value === 'ml' || value === 'en'
}

export type Strings = {
  brand: string
  month: string
  thisMonth: string
  go: string
  totalSpent: string
  totalSpentSoFar: string
  expenseCount: (count: number) => string
  highestDay: (day: string, amount: string) => string
  expenses: string
  sno: string
  date: string
  day: string
  amount: string
  total: string
  highest: string
  lowest: string
  noExpenses: string
  vsMonth: (month: string) => string
  noSpendingIn: (month: string) => string
  noChange: string
  spentIn: (month: string, amount: string) => string
  vsAverage: (months: number) => string
  notEnoughHistory: (found: number) => string
  onAverage: string
  verdict: Record<Verdict, string>
  average: (amount: string) => string
  typicalSwing: (amount: string) => string
  lastMonths: (months: number) => string
  noData: string
  averageOfMonths: (amount: string) => string
  inProgressNote: (month: string) => string
  pageTitle: (month: string) => string
  totalTillDate: string
  since: (date: string) => string
  perYear: string
  payments: string
  paymentCount: (count: number) => string
  noPayments: string
  totalPaid: string
  balanceDue: (amount: string) => string
}

const en: Strings = {
  brand: 'Radhu · Expenses',
  month: 'Month',
  thisMonth: 'this month',
  go: 'Go',
  totalSpent: 'Total spent',
  totalSpentSoFar: 'Total spent so far',
  expenseCount: (count) => `${count} ${count === 1 ? 'expense' : 'expenses'}`,
  highestDay: (day, amount) => `Highest day: ${day} (${amount})`,
  expenses: 'Expenses',
  sno: 'S.No',
  date: 'Date',
  day: 'Day',
  amount: 'Amount',
  total: 'Total',
  highest: 'Highest',
  lowest: 'Lowest',
  noExpenses: 'No expenses recorded this month.',
  vsMonth: (month) => `vs ${month}`,
  noSpendingIn: (month) => `No spending recorded in ${month}`,
  noChange: 'No change',
  spentIn: (month, amount) => `${amount} in ${month}`,
  vsAverage: (months) => `vs ${months}-month average`,
  notEnoughHistory: (found) =>
    `Not enough history yet (needs 2 months with spending, found ${found})`,
  onAverage: 'On average',
  verdict: {
    higher: 'Higher than usual',
    normal: 'Within your normal range',
    lower: 'Lower than usual',
  },
  average: (amount) => `Average ${amount}`,
  typicalSwing: (amount) => `Typical swing ±${amount} (std dev)`,
  lastMonths: (months) => `Last ${months} months`,
  noData: 'No data',
  averageOfMonths: (amount) => `Average of months with spending: ${amount}`,
  inProgressNote: (month) =>
    `${month} is still in progress, so these comparisons are against full months.`,
  pageTitle: (month) => `${month} expenses · Radhu`,
  totalTillDate: 'Total expenses till date',
  since: (date) => `since ${date}`,
  perYear: 'Expenses per year',
  payments: 'Payments',
  paymentCount: (count) => `${count} ${count === 1 ? 'payment' : 'payments'}`,
  noPayments: 'No payments made this month.',
  totalPaid: 'Total paid',
  balanceDue: (amount) => `Balance due now: ${amount}`,
}

const ml: Strings = {
  brand: 'രാധു · ചെലവുകൾ',
  month: 'മാസം',
  thisMonth: 'ഈ മാസം',
  go: 'കാണുക',
  totalSpent: 'ആകെ ചെലവ്',
  totalSpentSoFar: 'ഈ മാസം ഇതുവരെയുള്ള ചെലവ്',
  expenseCount: (count) => `${count} ${count === 1 ? 'ചെലവ്' : 'ചെലവുകൾ'}`,
  highestDay: (day, amount) => `ഏറ്റവും കൂടുതൽ ചെലവായ ദിവസം: ${day} (${amount})`,
  expenses: 'ചെലവുകൾ',
  sno: 'ക്രമ നം.',
  date: 'തീയതി',
  day: 'ദിവസം',
  amount: 'തുക',
  total: 'ആകെ',
  highest: 'ഏറ്റവും കൂടുതൽ',
  lowest: 'ഏറ്റവും കുറവ്',
  noExpenses: 'ഈ മാസം ചെലവുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.',
  vsMonth: (month) => `${month} മാസവുമായി താരതമ്യം`,
  noSpendingIn: (month) => `${month} മാസം ചെലവുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല`,
  noChange: 'മാറ്റമില്ല',
  spentIn: (month, amount) => `${month} മാസം: ${amount}`,
  vsAverage: (months) => `${months} മാസത്തെ ശരാശരിയുമായി`,
  notEnoughHistory: (found) =>
    `താരതമ്യത്തിന് ആവശ്യമായ വിവരങ്ങളില്ല (ചെലവുള്ള 2 മാസമെങ്കിലും വേണം, ഇപ്പോൾ ${found})`,
  onAverage: 'ശരാശരിക്കൊപ്പം',
  verdict: {
    higher: 'പതിവിലും കൂടുതൽ',
    normal: 'സാധാരണ പരിധിയിൽ',
    lower: 'പതിവിലും കുറവ്',
  },
  average: (amount) => `ശരാശരി ${amount}`,
  typicalSwing: (amount) => `സാധാരണ വ്യതിയാനം ±${amount} (സ്റ്റാൻഡേർഡ് ഡീവിയേഷൻ)`,
  lastMonths: (months) => `കഴിഞ്ഞ ${months} മാസം`,
  noData: 'വിവരമില്ല',
  averageOfMonths: (amount) => `ചെലവുള്ള മാസങ്ങളുടെ ശരാശരി: ${amount}`,
  inProgressNote: (month) =>
    `${month} മാസം പൂർത്തിയായിട്ടില്ല, അതിനാൽ ഈ താരതമ്യങ്ങൾ പൂർണ്ണ മാസങ്ങളുമായാണ്.`,
  pageTitle: (month) => `${month} ചെലവുകൾ · രാധു`,
  totalTillDate: 'ഇതുവരെയുള്ള ആകെ ചെലവ്',
  since: (date) => `${date} മുതൽ`,
  perYear: 'ഓരോ വർഷത്തെയും ചെലവ്',
  payments: 'പണമടവുകൾ',
  paymentCount: (count) => `${count} ${count === 1 ? 'പണമടവ്' : 'പണമടവുകൾ'}`,
  noPayments: 'ഈ മാസം പണമടവുകളൊന്നും നടത്തിയിട്ടില്ല.',
  totalPaid: 'ആകെ അടച്ചത്',
  balanceDue: (amount) => `ഇപ്പോൾ അടയ്ക്കാനുള്ള ബാക്കി: ${amount}`,
}

export const STRINGS: Record<Lang, Strings> = { en, ml }

const LOCALES: Record<Lang, string> = { en: 'en-US', ml: 'ml-IN' }

function format(lang: Lang, date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { timeZone: 'UTC', ...options }).format(date)
}

function monthDate(month: string): Date {
  return new Date(`${month}-01T00:00:00Z`)
}

// Month names stay in English in every language.
export function monthNameLabel(month: string): string {
  return format('en', monthDate(month), { month: 'long' })
}

export function monthTitleLabel(month: string): string {
  return `${monthNameLabel(month)} ${month.slice(0, 4)}`
}

export function monthShortLabel(month: string): string {
  return `${format('en', monthDate(month), { month: 'short' })} ${month.slice(0, 4)}`
}

export function fullDateLabel(date: string): string {
  return format('en', new Date(`${date}T00:00:00Z`), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function dayMonthLabel(date: string): string {
  return format('en', new Date(`${date}T00:00:00Z`), { month: 'short', day: 'numeric' })
}

export function localWeekday(date: string, lang: Lang): string {
  return format(lang, new Date(`${date}T00:00:00Z`), { weekday: 'long' })
}
