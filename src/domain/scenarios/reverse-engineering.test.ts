import { describe, expect, it } from 'vitest'
import { computeCommission, findMarket, type CommissionInput } from '../commission'
import { minimalTeam, nonDominated, reverseEngineer, scenarioForOwnExtra, type ScenarioOutcome } from './reverse-engineering'
import { applyScenario } from './scenario'

const ES = findMarket('ES')!
/** Synthetic partner: CT 600, generations 900 / 700, legs with VE 1,000 and 600 (level 2, 361.68 €). */
const E: CommissionInput = { customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }

function ok(outcome: ScenarioOutcome) {
  if (outcome.status !== 'ok') throw new Error(`expected a scenario, got ${outcome.reason}`)
  return outcome.scenario
}

describe('minimalTeam: different strategies need different totals', () => {
  // Level 3 needs TT-1 ≥ 1,600 (TT-1 is 1,200 now): 529.32 € is the amount on entering level 3.
  it.each([
    ['levelling', [0, 400], 529.32], // all to the weak leg: TT-1 grows 1:1
    ['equal', [400, 400], 571.56], // half the points go to the strongest leg
    ['proportional', [666.66, 400], 599.72], // most points go to the strongest leg
  ] as const)('%s', (strategy, legExtras, amount) => {
    const found = minimalTeam(E, ES, 529.32, 0, strategy)!
    expect(found.scenario.legExtras).toEqual(legExtras)
    expect(found.result.level).toBe(3)
    expect(found.result.amount).toBe(amount)
  })

  it('is null without legs', () => {
    expect(minimalTeam({ ...E, teamVolumes: [] }, ES, 600, 0, 'levelling')).toBeNull()
  })
})

describe('reverseEngineer (D-021): target 600 €', () => {
  const result = reverseEngineer(E, ES, 600)

  it('«Solo yo» is the exact own-CT minimum: +225 → level 3, 602.91 €', () => {
    const scenario = ok(result.ownOnly)
    expect(scenario).toMatchObject({ ownExtra: 225, teamExtra: 0, exact: true, difference: 2.91 })
    expect(scenario.result.amount).toBe(602.91)
  })

  it('«Mayor aportación del equipo»: no own points, 1,069.28 team points split by levelling', () => {
    const scenario = ok(result.moreTeam)
    expect(scenario).toMatchObject({ ownExtra: 0, teamExtra: 1069.28, strategy: 'levelling', exact: false })
    expect(scenario.scenario.legExtras).toEqual([334.64, 734.64])
    expect(scenario.result.amount).toBe(600)
  })

  it('«Mi equipo y yo»: half the own effort (+112.50) and about half the team effort', () => {
    const scenario = ok(result.balanced)
    expect(scenario.ownExtra).toBe(112.5)
    expect(scenario.teamExtra).toBe(520.84)
    expect(scenario.scenario.legExtras).toEqual([60.42, 460.42])
    // Level 3: (712.5 × 39 % + 1,420.84 × 8 % + 700 × 9 %) × 1.32 = 600.00 €
    expect(scenario.result.level).toBe(3)
    expect(scenario.result.amount).toBe(600)
  })

  it('every scenario really reaches the target with the same engine', () => {
    for (const outcome of [result.ownOnly, result.balanced, result.moreTeam]) {
      const scenario = ok(outcome)
      const recomputed = computeCommission(applyScenario(E, scenario.scenario), ES)
      expect(recomputed.amount).toBe(scenario.result.amount)
      expect(recomputed.amount).toBeGreaterThanOrEqual(600)
    }
  })

  it('never returns duplicated scenarios', () => {
    const scenarios = [result.ownOnly, result.balanced, result.moreTeam].map(ok)
    const keys = scenarios.map((scenario) => JSON.stringify([scenario.ownExtra, scenario.scenario.legExtras]))
    expect(new Set(keys).size).toBe(3)
  })
})

describe('reverseEngineer: special cases', () => {
  it('needs nothing when the target is already reached', () => {
    expect(reverseEngineer(E, ES, 300).alreadyReached).toBe(true)
  })

  it('without legs, only «Solo yo» is possible', () => {
    const result = reverseEngineer({ customerTurnover: 600, generationVolumes: [], teamVolumes: [] }, ES, 600)
    expect(ok(result.ownOnly).ownExtra).toBeGreaterThan(0)
    expect(result.balanced).toEqual({ status: 'infeasible', reason: 'noLegs' })
    expect(result.moreTeam).toEqual({ status: 'infeasible', reason: 'noLegs' })
  })

  it('below level 1 the team alone cannot help; combinations need at least 110 own points', () => {
    const below: CommissionInput = { customerTurnover: 50, generationVolumes: [2000], teamVolumes: [1200, 800] }
    const result = reverseEngineer(below, ES, 400)
    for (const outcome of [result.balanced, result.moreTeam]) {
      const scenario = ok(outcome)
      expect(below.customerTurnover + scenario.ownExtra).toBeGreaterThanOrEqual(110)
      expect(scenario.result.amount).toBeGreaterThanOrEqual(400)
    }
    expect(scenarioForOwnExtra(below, ES, 400, 0)).toEqual({ status: 'infeasible', reason: 'ownBelowLevel1' })
  })

  it('lands on level jumps: 529.32 € is reached exactly on entering level 3', () => {
    const scenario = ok(reverseEngineer(E, ES, 529.32).moreTeam)
    expect(scenario.teamExtra).toBe(400)
    expect(scenario.difference).toBe(0)
  })

  it('compares the amount once rounded to cents (BR-17)', () => {
    // 1,069.28 team points give 599.996 €, which rounds to 600.00 €.
    expect(ok(reverseEngineer(E, ES, 600).moreTeam).teamExtra).toBe(1069.28)
  })
})

describe('scenarioForOwnExtra: manual own effort', () => {
  it('fixes own +100 and finds the team points: 581.78, levelled', () => {
    const scenario = ok(scenarioForOwnExtra(E, ES, 600, 100))
    expect(scenario).toMatchObject({ kind: 'manual', ownExtra: 100, teamExtra: 581.78, strategy: 'levelling' })
    expect(scenario.scenario.legExtras).toEqual([90.89, 490.89])
    expect(scenario.result.amount).toBeGreaterThanOrEqual(600)
  })

  it('needs no team points when own points alone suffice', () => {
    expect(ok(scenarioForOwnExtra(E, ES, 600, 300))).toMatchObject({ teamExtra: 0, strategy: null })
  })

  it('more own points never need more team points', () => {
    let previous = Infinity
    for (const own of [0, 50, 100, 150, 200, 225]) {
      const team = ok(scenarioForOwnExtra(E, ES, 600, own)).teamExtra
      expect(team).toBeLessThanOrEqual(previous)
      previous = team
    }
  })
})

describe('nonDominated', () => {
  it('keeps only candidates that no other beats on both own and team points', () => {
    const candidates = [
      { own: 0, team: 1000 },
      { own: 100, team: 500 },
      { own: 100, team: 600 }, // dominated by (100, 500)
      { own: 200, team: 500 }, // dominated by (100, 500)
      { own: 225, team: 0 },
    ]
    expect(nonDominated(candidates)).toEqual([
      { own: 0, team: 1000 },
      { own: 100, team: 500 },
      { own: 225, team: 0 },
    ])
  })
})
