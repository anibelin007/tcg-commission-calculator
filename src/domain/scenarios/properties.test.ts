import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../commission'
import { reverseEngineer, scenarioForOwnExtra } from './reverse-engineering'
import { applyScenario } from './scenario'

/** Deterministic pseudo-random generator (LCG), so failures are reproducible. */
function random(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

/** Synthetic, coherent partner data: legs add up to generation 1–3 of the downline. */
function randomPartner(next: () => number): CommissionInput {
  const legs = Array.from({ length: Math.floor(next() * 5) }, () => Math.round(next() * 6000 * 100) / 100)
  const total = legs.reduce((a, b) => a + b, 0)
  const g1 = Math.round(total * (0.3 + next() * 0.4) * 100) / 100
  const g2 = Math.round((total - g1) * next() * 100) / 100
  return {
    customerTurnover: Math.round(next() * 1500 * 100) / 100,
    generationVolumes: legs.length ? [g1, g2, Math.round((total - g1 - g2) * 100) / 100] : [],
    teamVolumes: legs,
  }
}

const MARKETS = ['ES', 'MX', 'US', 'PL'].map((id) => findMarket(id)!)

describe('properties (D-021)', () => {
  it('the commission never decreases when own points or any leg points grow', () => {
    const next = random(42)
    for (let i = 0; i < 300; i++) {
      const input = randomPartner(next)
      const market = MARKETS[i % MARKETS.length]!
      const base = computeCommission(input, market).amount
      const legIndex = Math.floor(next() * input.teamVolumes.length)
      const legExtras = input.teamVolumes.map((_, index) => (index === legIndex ? Math.round(next() * 3000) : 0))
      const ownExtra = Math.round(next() * 1000)
      expect(computeCommission(applyScenario(input, { ownExtra, legExtras: [] }), market).amount).toBeGreaterThanOrEqual(base)
      expect(computeCommission(applyScenario(input, { ownExtra: 0, legExtras }), market).amount).toBeGreaterThanOrEqual(base)
      // Simultaneous increments in several legs.
      const all = input.teamVolumes.map(() => Math.round(next() * 500))
      expect(computeCommission(applyScenario(input, { ownExtra, legExtras: all }), market).amount).toBeGreaterThanOrEqual(base)
    }
  })

  it('every scenario returned reaches the target, and is checked with the engine', () => {
    const next = random(7)
    for (let i = 0; i < 40; i++) {
      const input = randomPartner(next)
      const market = MARKETS[i % MARKETS.length]!
      const current = computeCommission(input, market).amount
      const target = Math.round((current + 50 + next() * 1500 * market.pointsFactor) * 100) / 100
      const result = reverseEngineer(input, market, target)
      for (const outcome of [result.ownOnly, result.balanced, result.moreTeam]) {
        if (outcome.status !== 'ok') continue
        const amount = computeCommission(applyScenario(input, outcome.scenario.scenario), market).amount
        expect(amount).toBe(outcome.scenario.result.amount)
        expect(amount).toBeGreaterThanOrEqual(target)
        expect(outcome.scenario.scenario.legExtras.every((extra) => extra >= 0)).toBe(true)
      }
      const manual = scenarioForOwnExtra(input, market, target, Math.round(next() * 300))
      if (manual.status === 'ok') {
        expect(computeCommission(applyScenario(input, manual.scenario.scenario), market).amount).toBeGreaterThanOrEqual(target)
      }
    }
  })

  it('«Mi equipo y yo» and «Mayor aportación del equipo» are not dominated by each other', () => {
    const next = random(99)
    for (let i = 0; i < 30; i++) {
      const input = randomPartner(next)
      const market = MARKETS[i % MARKETS.length]!
      const target = computeCommission(input, market).amount + 300 * market.pointsFactor
      const { balanced, moreTeam } = reverseEngineer(input, market, target)
      if (balanced.status !== 'ok' || moreTeam.status !== 'ok') continue
      const b = balanced.scenario
      const m = moreTeam.scenario
      expect(m.ownExtra).toBeLessThanOrEqual(b.ownExtra)
      expect(b.ownExtra <= m.ownExtra && b.teamExtra <= m.teamExtra && (b.ownExtra < m.ownExtra || b.teamExtra < m.teamExtra)).toBe(false)
    }
  })
})
