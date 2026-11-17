/** A calendar month, `month` 1–12. Stored as 'YYYY-MM'. */
export interface YearMonth {
  readonly year: number
  readonly month: number
}

export function yearMonthOf(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function parseYearMonth(value: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  return month >= 1 && month <= 12 ? { year, month } : null
}

export function formatYearMonth({ year, month }: YearMonth): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/** Negative if `a` is before `b`, 0 if equal, positive if after. */
export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

/** `count` consecutive months starting at `from`. */
export function nextMonths(from: YearMonth, count: number): YearMonth[] {
  return Array.from({ length: count }, (_, i) => addMonths(from, i))
}

/** «diciembre de 2026», «December 2026»… in the UI language. */
export function monthLabel(locale: string, { year, month }: YearMonth): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}
