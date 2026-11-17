/** Locale-aware formatting of points, percentages and amounts (display only). */
export function formatPoints(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}

export function formatRate(locale: string, rate: number): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(rate)
}

export function formatAmount(locale: string, amount: number, currency: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function formatFactor(locale: string, factor: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(factor)
}

/** Country name in the UI language (e.g. `AT` → «Austria»). `IC` is the Canary Islands. */
export function countryName(locale: string, country: string): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(country) ?? country
}
