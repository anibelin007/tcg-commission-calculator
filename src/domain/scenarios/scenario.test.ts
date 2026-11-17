import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../commission'
import { applyScenario, teamExtraOf } from './scenario'

const ES = findMarket('ES')!
/** Synthetic partner: CT 600, generations 900 / 700, legs with VE 1,000 and 600 (level 2, 361.68 €). */
const E: CommissionInput = { customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }

describe('applyScenario (D-021)', () => {
  it('adds own points to CT and each leg extra once to generation 1 and to its leg', () => {
    expect(applyScenario(E, { ownExtra: 50, legExtras: [10, 20] })).toEqual({
      customerTurnover: 650,
      generationVolumes: [930, 700],
      teamVolumes: [1010, 620],
    })
  })

  it('never modifies the real data', () => {
    const copy = structuredClone(E)
    applyScenario(E, { ownExtra: 50, legExtras: [10, 20] })
    expect(E).toEqual(copy)
  })

  it('keeps the data coherent: extra downline = extra in the legs', () => {
    const scenario = { ownExtra: 0, legExtras: [123.45, 67.89] }
    const applied = applyScenario(E, scenario)
    const downline = (input: CommissionInput) => input.generationVolumes.reduce((a, b) => a + b, 0)
    const legs = (input: CommissionInput) => input.teamVolumes.reduce((a, b) => a + b, 0)
    expect(downline(applied) - downline(E)).toBeCloseTo(teamExtraOf(scenario), 6)
    expect(legs(applied) - legs(E)).toBeCloseTo(teamExtraOf(scenario), 6)
    expect(computeCommission(applied, ES).warnings).toEqual([])
  })

  it('recomputes the order of the legs: a weak leg can become the strongest', () => {
    // +600 to the weak leg: legs 1,000 / 1,200 → strongest is now leg 2; TT-1 = 2,800 − 1,200 = 1,600 → level 3.
    const result = computeCommission(applyScenario(E, { ownExtra: 0, legExtras: [0, 600] }), ES)
    expect(result.volumes.tt).toBe(2800)
    expect(result.volumes.tt1).toBe(1600)
    expect(result.level).toBe(3)
  })

  it('rejects more extras than legs', () => {
    expect(() => applyScenario(E, { ownExtra: 0, legExtras: [1, 2, 3] })).toThrow()
  })
})
