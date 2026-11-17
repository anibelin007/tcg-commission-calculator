import { describe, expect, it } from 'vitest'
import { findMarket } from './markets'
import { commissionCurve, simulateNextLevel, simulateTargetAmount, simulateTargetAmountWithTeam } from './simulation'
import type { CommissionInput } from './volumes'

const ES = findMarket('ES')!
const US = findMarket('US')!
const solo = (ct: number): CommissionInput => ({ customerTurnover: ct, generationVolumes: [], teamVolumes: [] })

/** Synthetic partner at level 2 with one strong team: TT 1,427, TT-1 327. */
const WITH_TEAM: CommissionInput = { customerTurnover: 327, generationVolumes: [300, 200, 400, 200], teamVolumes: [1100] }

describe('simulateNextLevel (PF-02)', () => {
  it('824 → level 3 needs 1 more point (CT ≥ 825), or 776 via CT 330 + TT-1 1,600', () => {
    const next = simulateNextLevel(solo(824), ES)!
    expect(next.level).toBe(3)
    expect(next.paths).toEqual([
      { own: { measure: 'ct', min: 330, missing: 0 }, team: { measure: 'tt1', min: 1600, missing: 776 }, extraOwnAlone: 776 },
      { own: { measure: 'ct', min: 825, missing: 1 }, extraOwnAlone: 1 },
    ])
    expect(next.extraOwn).toBe(1)
    expect(next.result.level).toBe(3)
    expect(next.result.amount).toBe(424.71)
  })

  it('reports the team gap separately when the strongest team does not count (TT-1)', () => {
    const next = simulateNextLevel(WITH_TEAM, ES)!
    expect(next.level).toBe(3)
    expect(next.paths[0]).toEqual({
      own: { measure: 'ct', min: 330, missing: 3 },
      team: { measure: 'tt1', min: 1600, missing: 1273 },
      extraOwnAlone: 1273,
    })
    expect(next.extraOwn).toBe(498) // CT 825 is the cheapest way with this team
    expect(next.result.level).toBe(3)
  })

  it('handles decimals: 2.38 points missing are 2.38, not 3', () => {
    // Level 2 with TT-1 1,827.62: level 3 only needs CT 330.
    const next = simulateNextLevel({ customerTurnover: 327.62, generationVolumes: [3000], teamVolumes: [1500, 1500] }, ES)!
    expect(next.level).toBe(3)
    expect(next.paths[0]!.own.missing).toBe(2.38)
    expect(next.extraOwn).toBe(2.38)
  })

  it('starts at level 1 when there is no level yet', () => {
    const next = simulateNextLevel(solo(50), ES)!
    expect(next.level).toBe(1)
    expect(next.extraOwn).toBe(60)
  })

  it('returns null at level 10', () => {
    const input: CommissionInput = { customerTurnover: 660, generationVolumes: [270000], teamVolumes: [70000, 70000, 70000, 60000] }
    expect(simulateNextLevel(input, ES)).toBeNull()
  })

  it('USA: from level 3, own purchases do not help for level 4 (CT ≥ 330)', () => {
    const input: CommissionInput = { customerTurnover: 300, personalTurnover: 200, generationVolumes: [13000], teamVolumes: [10000, 3000] }
    const next = simulateNextLevel(input, US)!
    expect(next.level).toBe(4)
    expect(next.extraOwn).toBe(30)
  })
})

describe('simulateTargetAmount (PF-03)', () => {
  it('514.80 € without team needs CT 1,000 (EU-ES p. 14)', () => {
    expect(simulateTargetAmount(solo(0), ES, 514.8)?.extraOwn).toBe(1000)
  })

  it('a target inside a jump lands on the jump: 400 € needs CT 825 (424.71 €)', () => {
    const simulation = simulateTargetAmount(solo(0), ES, 400)!
    expect(simulation.extraOwn).toBe(825)
    expect(simulation.result.amount).toBe(424.71)
  })

  it('needs nothing when the target is already reached', () => {
    expect(simulateTargetAmount(solo(1000), ES, 100)).toMatchObject({ extraOwn: 0 })
  })

  it('counts the team as entered', () => {
    const simulation = simulateTargetAmount(WITH_TEAM, ES, 500)!
    expect(simulation.result.amount).toBeGreaterThanOrEqual(500)
    const justBelow = simulateTargetAmount({ ...WITH_TEAM, customerTurnover: WITH_TEAM.customerTurnover + simulation.extraOwn - 0.01 }, ES, 500)!
    expect(justBelow.extraOwn).toBe(0.01)
  })
})

describe('simulateTargetAmountWithTeam (PF-03, team route)', () => {
  // CT 600, generations 900 / 700, direct partners' VE 1,000 / 600: level 2, 361.68 €.
  const example: CommissionInput = { customerTurnover: 600, generationVolumes: [900, 700], teamVolumes: [1000, 600] }

  it('team points outside the strongest teams raise TT-1: +400 reaches level 3 (TT-1 1,600)', () => {
    const simulation = simulateTargetAmountWithTeam(example, ES, 529.32)!
    expect(simulation.extraTeam).toBe(400)
    expect(simulation.result.level).toBe(3)
    expect(simulation.result.volumes.tt1).toBe(1600)
  })

  it('600 € needs 1,069.28 team points in generation 1 (paid at 8 %), versus 225 own points', () => {
    // Level 3: (600 × 39 % + (900 + Δ) × 8 % + 700 × 9 %) × 1.32 = 599.996 € at Δ = 1,069.28,
    // which rounds to 600.00 € (BR-17: the amount is compared once rounded to cents).
    const simulation = simulateTargetAmountWithTeam(example, ES, 600)!
    expect(simulation.extraTeam).toBe(1069.28)
    expect(simulation.result.level).toBe(3)
    expect(simulation.result.amount).toBeGreaterThanOrEqual(600)
    expect(simulateTargetAmount(example, ES, 600)!.extraOwn).toBe(225)
  })

  it('cannot help below level 1 (no team commission without 110 own points)', () => {
    expect(simulateTargetAmountWithTeam({ ...example, customerTurnover: 100 }, ES, 100)).toBeNull()
  })
})

describe('commissionCurve (PF-04)', () => {
  it('includes both sides of every jump', () => {
    const curve = commissionCurve(solo(0), ES, 1000)
    expect(curve.map((point) => [point.ownTurnover, point.level])).toEqual([
      [0, null],
      [109.99, null],
      [110, 1],
      [384.99, 1],
      [385, 2],
      [824.99, 2],
      [825, 3],
      [1000, 3],
    ])
    expect(curve.at(-1)!.amount).toBe(514.8)
  })
})
