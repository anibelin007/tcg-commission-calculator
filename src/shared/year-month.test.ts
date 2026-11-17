import { describe, expect, it } from 'vitest'
import { addMonths, compareYearMonth, formatYearMonth, monthLabel, nextMonths, parseYearMonth } from './year-month'

describe('year-month', () => {
  it('parses and formats', () => {
    expect(parseYearMonth('2026-12')).toEqual({ year: 2026, month: 12 })
    expect(parseYearMonth('2026-13')).toBeNull()
    expect(parseYearMonth('')).toBeNull()
    expect(formatYearMonth({ year: 2027, month: 1 })).toBe('2027-01')
  })

  it('adds months across years', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 })
  })

  it('compares and lists', () => {
    expect(compareYearMonth({ year: 2026, month: 11 }, { year: 2026, month: 12 })).toBeLessThan(0)
    expect(nextMonths({ year: 2026, month: 11 }, 3).map(formatYearMonth)).toEqual(['2026-11', '2026-12', '2027-01'])
  })

  it('labels in the UI language', () => {
    expect(monthLabel('es-ES', { year: 2026, month: 12 })).toBe('diciembre de 2026')
    expect(monthLabel('en-GB', { year: 2026, month: 12 })).toBe('December 2026')
  })
})
