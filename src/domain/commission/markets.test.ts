import { describe, expect, it } from 'vitest'
import { MARKETS } from './markets'

describe('markets (docs/sources/ringana-countries.md)', () => {
  it('offers the 35 countries with a known plan and factor', () => {
    expect(new Set(MARKETS.map((market) => market.country)).size).toBe(35)
  })

  it('has unique IDs', () => {
    const ids = MARKETS.map((market) => market.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('does not offer countries pending verification or closed to partners (Q-13, Q-14)', () => {
    const countries = MARKETS.map((market) => market.country)
    for (const pending of ['TR', 'LI', 'HK', 'MC']) expect(countries).not.toContain(pending)
  })

  it('splits France and Italy by contract type', () => {
    expect(MARKETS.filter((market) => market.country === 'FR').map((market) => market.pointsFactor)).toEqual([1.216, 1.32])
    expect(MARKETS.filter((market) => market.country === 'IT').map((market) => market.pointsFactor)).toEqual([1.32, 1.251])
  })
})
