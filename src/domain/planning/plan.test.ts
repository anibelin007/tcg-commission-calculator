import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket } from '../commission'
import { partnersNeeded } from './partners-needed'
import { checkTarget, daysLeftInMonth, generationShares, pace, planToInput, surplusOverLevel, type Plan } from './plan'

const ES = findMarket('ES')!
/** Synthetic plan: own CT 600, legs expected at 1,000 and 600 (all in generation 1 by default). */
const P: Plan = { ownCt: 600, legs: [1000, 600] }

describe('planToInput', () => {
  it('puts the legs in generation 1 by default', () => {
    expect(planToInput(P)).toEqual({ customerTurnover: 600, generationVolumes: [1600], teamVolumes: [1000, 600] })
  })

  it('spreads the legs like the real generations when available', () => {
    const shares = generationShares([900, 700])!
    const input = planToInput({ ...P, generationShares: shares })
    expect(input.generationVolumes).toEqual([900, 700])
    expect(computeCommission(input, ES).amount).toBe(361.68)
  })

  it('has no shares without real generations', () => {
    expect(generationShares([0, 0])).toBeUndefined()
  })
})

describe('checkTarget (tab 2)', () => {
  it('level 5 (VC ≥ 550 and VE-2 ≥ 4,000): VE-2 is only 600, so own CT would need 4,000', () => {
    const check = checkTarget(P, ES, 5)
    expect(check.met).toBe(false)
    expect(check.paths).toEqual([
      {
        requirements: [
          { measure: 'ct', min: 550, actual: 600, missing: 0 },
          { measure: 'tt2', min: 4000, actual: 600, missing: 3400 },
        ],
        met: false,
      },
    ])
    expect(check.ownNeeded).toBe(4000)
  })

  it('level 3: the cheapest way with these legs is CT 825; estimated 593.67 €', () => {
    const check = checkTarget(P, ES, 3)
    expect(check.paths.map((path) => path.requirements.map((r) => r.missing))).toEqual([[0, 400], [225]])
    expect(check.ownNeeded).toBe(825)
    // (825 × 39 % + 1,600 × 8 %) × 1.32 = 593.67 €
    expect(check.resultWithOwnNeeded.amount).toBe(593.67)
  })

  it('level 2 is already met: VC ≥ 385; estimated 398.64 €', () => {
    const check = checkTarget(P, ES, 2)
    expect(check.met).toBe(true)
    expect(check.result.level).toBe(2)
    expect(check.result.amount).toBe(398.64)
    expect(check.resultWithOwnNeeded).toBe(check.result)
  })

  it('counts own CT in TT-n: with legs 2,000 / 2,000 / 1,000, level 5 needs own CT 3,000', () => {
    // VE-2 = own + 1,000 ≥ 4,000 → own ≥ 3,000 (and ≥ 550).
    expect(checkTarget({ ownCt: 0, legs: [2000, 2000, 1000] }, ES, 5).ownNeeded).toBe(3000)
  })
})

describe('surplusOverLevel', () => {
  it('measures the main requirement of the reached level, like the planner sheet', () => {
    // Level 2 via VC ≥ 220 and VE ≥ 1,000: VE 2,200 → +120 %.
    expect(surplusOverLevel(P, ES, 2)).toBeCloseTo(1.2, 6)
  })
})

describe('progress', () => {
  it('counts the days left in the month, today included', () => {
    expect(daysLeftInMonth(new Date(2026, 10, 17))).toBe(14)
    expect(daysLeftInMonth(new Date(2026, 1, 28))).toBe(1)
  })

  it('gives the points missing and the daily pace', () => {
    expect(pace(1000, 400, 14)).toEqual({ missing: 600, perDay: 42.86 })
    expect(pace(1000, 1200, 14)).toEqual({ missing: 0, perDay: 0 })
  })
})

describe('partnersNeeded (tab 3)', () => {
  it('with partners making 300 each, 4 more legs reach 600 € (level 3 from the 2nd one)', () => {
    const input = { customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }
    const needed = partnersNeeded(input, ES, 600, 300)!
    expect(needed.count).toBe(4)
    expect(needed.result.level).toBe(3)
    expect(needed.result.amount).toBe(613.8)
  })

  it('is null without a positive average or beyond the maximum', () => {
    const input = { customerTurnover: 600, generationVolumes: [], teamVolumes: [] }
    expect(partnersNeeded(input, ES, 600, 0)).toBeNull()
    expect(partnersNeeded(input, ES, 1_000_000, 10, 5)).toBeNull()
  })
})
