import { describe, expect, it } from 'vitest'
import { computeCommission } from './commission'
import { findMarket, type Market } from './markets'
import type { TargetLevel } from './plans'
import type { CommissionInput } from './volumes'

function market(id: string): Market {
  const found = findMarket(id)
  if (!found) throw new Error(`Unknown market ${id}`)
  return found
}

const ES = market('ES')
const MX = market('MX')
const US = market('US')

/** Own CT only, no team. */
const solo = (ct: number): CommissionInput => ({ customerTurnover: ct, generationVolumes: [], teamVolumes: [] })

/** Teams that are a single direct partner each (all their volume in generation 1). */
function directOnly(ct: number, teamVolumes: readonly number[]): CommissionInput {
  return { customerTurnover: ct, generationVolumes: [teamVolumes.reduce((a, b) => a + b, 0)], teamVolumes }
}

/**
 * Guideline example (EU-ES p. 9–10, 15): team 1 = A (700) → C (1,000); team 2 = B (900) →
 * D (600), E (300). As the Online Office shows it: generations 1,600 / 1,900; direct
 * partners' VE 1,700 / 1,800; breakdown of the strongest team (team 2) 900 / 900.
 */
const GUIDE_TEAM: CommissionInput = {
  customerTurnover: 1000,
  generationVolumes: [1600, 1900],
  teamVolumes: [1700, 1800],
  strongestTeamGenerations: [900, 900],
}

describe('guideline cases (docs/qa/test-cases.md)', () => {
  it('TC-01: CT 1,000 without team → level 3, 390 points, 514.80 € (EU-ES p. 14)', () => {
    const result = computeCommission(solo(1000), ES)
    expect(result.level).toBe(3)
    expect(result.totalPoints).toBe(390)
    expect(result.amount).toBe(514.8)
    expect(result.payout).toBe('transfer')
  })

  it('TC-01 MX: 390 points × 26 = 10,140 MXN (MX p. 13–14)', () => {
    expect(computeCommission(solo(1000), MX).amount).toBe(10140)
  })

  it('TC-03: TT 4,500 and TT-1 2,700 (EU-ES p. 9–10)', () => {
    const { volumes } = computeCommission(GUIDE_TEAM, ES)
    expect(volumes.tt).toBe(4500)
    expect(volumes.tt1).toBe(2700)
  })

  describe('TC-02: guideline team example (EU-ES p. 15)', () => {
    it('reproduces the guideline result (689 points, 909.48 €) when the limit caps commission points (Q-01 option c)', () => {
      const result = computeCommission(GUIDE_TEAM, ES, { strongestTeamLimit: 'commissionPoints' })
      expect(result.level).toBe(3)
      expect(result.generations.map((g) => g.points)).toEqual([128, 171, 0, 0])
      expect(result.totalPoints).toBe(689)
      expect(result.amount).toBe(909.48)
    })

    it('same example in MX and USA: 17,914 MXN and $ 1,102.40 (MX p. 15–16, USA p. 15–16)', () => {
      expect(computeCommission(GUIDE_TEAM, MX, { strongestTeamLimit: 'commissionPoints' }).amount).toBe(17914)
      expect(computeCommission(GUIDE_TEAM, US, { strongestTeamLimit: 'commissionPoints' }).amount).toBe(1102.4)
    })

    it('by default (limit not applied, D-005) matches the guideline: 909.48 €, reporting the team above the limit', () => {
      const result = computeCommission(GUIDE_TEAM, ES)
      expect(result.amount).toBe(909.48)
      expect(result.strongestTeam).toEqual({ index: 1, volume: 1800, limit: 1500, status: 'notApplied', pointsBefore: null, pointsAfter: null })
    })

    it('differs under the former provisional reading (proportional on team volume): 663.5 points, 875.82 € (Q-01)', () => {
      const result = computeCommission(GUIDE_TEAM, ES, { strongestTeamLimit: 'teamVolumeProportional' })
      expect(result.strongestTeam).toEqual({ index: 1, volume: 1800, limit: 1500, status: 'applied', pointsBefore: 153, pointsAfter: 127.5 })
      expect(result.totalPoints).toBe(663.5)
      expect(result.amount).toBe(875.82)
      expect(result.warnings).toEqual([])
    })
  })
})

describe('derived boundary cases (docs/qa/test-cases.md)', () => {
  it.each([
    ['S-00', solo(109), null, 0, 0],
    ['S-01', solo(110), 1, 20.9, 27.59],
    ['S-02', solo(384), 1, 72.96, 96.31],
    ['S-03', solo(385), 2, 111.65, 147.38],
    ['S-04', solo(824), 2, 238.96, 315.43],
    ['S-05', solo(825), 3, 321.75, 424.71],
    ['S-06', directOnly(220, [780]), 2, 126.2, 166.58],
    ['S-07', { ...directOnly(400, [10000]), strongestTeamGenerations: [10000] }, 2, 916, 1209.12],
  ] as const)('%s', (_id, input, level, points, amount) => {
    const result = computeCommission(input, ES)
    expect(result.level).toBe(level)
    expect(result.totalPoints).toBe(points)
    expect(result.amount).toBe(amount)
  })

  it('S-00: no commission below level 1 (BR-09)', () => {
    expect(computeCommission(solo(109), ES).payout).toBe('none')
  })

  it('S-07 would be 258.72 € proportionally on team volume, and 1,209.12 € under Q-01 option (c)', () => {
    const input = { ...directOnly(400, [10000]), strongestTeamGenerations: [10000] }
    expect(computeCommission(input, ES, { strongestTeamLimit: 'teamVolumeProportional' }).amount).toBe(258.72)
    expect(computeCommission(input, ES, { strongestTeamLimit: 'commissionPoints' }).amount).toBe(1209.12)
  })

  it('S-01: 27.59 € is paid as a voucher (BR-16)', () => {
    expect(computeCommission(solo(110), ES).payout).toBe('voucher')
  })
})

describe('strongest-team limit input (BR-12)', () => {
  it('by default only reports the team above the limit and asks for nothing (D-005)', () => {
    expect(computeCommission(directOnly(400, [10000]), ES).strongestTeam?.status).toBe('notApplied')
  })

  it('with a limit strategy, asks for the breakdown and does not apply it meanwhile', () => {
    const result = computeCommission(directOnly(400, [10000]), ES, { strongestTeamLimit: 'teamVolumeProportional' })
    expect(result.strongestTeam).toEqual({ index: 0, volume: 10000, limit: 1000, status: 'breakdownMissing', pointsBefore: null, pointsAfter: null })
    expect(result.totalPoints).toBe(916)
  })

  it('reports nothing when the strongest team is within the limit', () => {
    expect(computeCommission(directOnly(400, [900]), ES).strongestTeam).toBeNull()
  })

  it('has no limit from level 8', () => {
    const input = directOnly(660, [30000, 30000, 30000, 19340])
    expect(computeCommission(input, ES).level).toBe(8)
    expect(computeCommission(input, ES).strongestTeam).toBeNull()
  })

  it('warns when there is downline but no direct partner VE (the level may be too high)', () => {
    const input = { customerTurnover: 1000, generationVolumes: [1600, 1900], teamVolumes: [] }
    const result = computeCommission(input, ES)
    expect(result.warnings).toEqual(['teamVolumesMissing'])
    expect(result.level).toBe(5) // TT-2 = TT = 4,500 without teams; level 3 once the VE are given (TC-02)
  })

  it('warns about inconsistent input', () => {
    expect(computeCommission({ customerTurnover: 400, generationVolumes: [500], teamVolumes: [600] }, ES).warnings).toEqual([
      'teamVolumesExceedDownline',
    ])
    const breakdown = { customerTurnover: 400, generationVolumes: [2000], teamVolumes: [2000], strongestTeamGenerations: [1500, 600] }
    expect(computeCommission(breakdown, ES).warnings).toEqual(['breakdownDoesNotMatchTeam', 'breakdownExceedsGeneration'])
  })
})

describe('target level minima (BR-07)', () => {
  // Strong teams are given so that only the criterion under test decides.
  const big = (volume: number, count: number) => Array.from({ length: count }, () => volume)

  it.each<[string, CommissionInput, TargetLevel | null]>([
    ['L2 via CT 220 + TT 1,000', directOnly(220, [780]), 2],
    ['TT 999 is not enough for L2', directOnly(220, [779]), 1],
    ['L3 via CT 330 + TT-1 1,600', directOnly(330, [5000, 1270]), 3],
    ['CT 329 stays at L2', directOnly(329, [5000, 1271]), 2],
    ['L4: CT 440 + TT-1 3,200', directOnly(440, [...big(10000, 1), 2760]), 4],
    ['L4 needs CT 440', directOnly(439, [...big(10000, 1), 2761]), 3],
    ['L5: CT 550 + TT-2 4,000', directOnly(550, [...big(10000, 2), 3450]), 5],
    ['L6: CT 660 + TT-2 8,000', directOnly(660, [...big(20000, 2), 7340]), 6],
    ['L7: CT 660 + TT-2 15,000', directOnly(660, [...big(30000, 2), 14340]), 7],
    ['L8: CT 660 + TT-3 20,000', directOnly(660, [...big(30000, 3), 19340]), 8],
    ['TT-3 19,999 stays at L7', directOnly(660, [...big(30000, 3), 19339]), 7],
    ['L9: CT 660 + TT-3 40,000', directOnly(660, [...big(50000, 3), 39340]), 9],
    ['L10: CT 660 + TT-3 60,000', directOnly(660, [...big(70000, 3), 59340]), 10],
    ['levels 6–10 need CT 660: CT 659 stays at L5', directOnly(659, [...big(70000, 3), 59341]), 5],
  ])('%s', (_name, input, level) => {
    expect(computeCommission(input, ES).level).toBe(level)
  })

  it('counts teams that are not listed (TT-n only subtracts the listed strongest teams)', () => {
    // Downline 6,000 but only one direct partner's VE given: TT-1 = 330 + 6,000 − 4,000.
    const input = { customerTurnover: 330, generationVolumes: [6000], teamVolumes: [4000] }
    expect(computeCommission(input, ES).volumes.tt1).toBe(2330)
  })
})

describe('generations (BR-05, BR-11)', () => {
  it('pays only the generations of the attained level', () => {
    // Level 2 pays generations 1–3; the 4th generation earns nothing but counts for TT.
    const input = { customerTurnover: 400, generationVolumes: [100, 100, 100, 100], teamVolumes: [400] }
    const result = computeCommission(input, ES)
    expect(result.level).toBe(2)
    expect(result.volumes.tt).toBe(800)
    expect(result.generations.map((g) => g.rate)).toEqual([0.08, 0.04, 0.03])
    expect(result.teamPoints).toBe(15)
  })

  it('never pays generation 10 or deeper, but counts it for TT', () => {
    const base = directOnly(660, [30000, 30000, 30000, 19340])
    const deep = { ...base, generationVolumes: [...base.generationVolumes, 0, 0, 0, 0, 0, 0, 0, 0, 5000] }
    const without = computeCommission(base, ES)
    const with10 = computeCommission(deep, ES)
    expect(with10.level).toBe(8)
    expect(with10.volumes.tt - without.volumes.tt).toBe(5000)
    expect(with10.generations).toHaveLength(9)
    expect(with10.teamPoints).toBe(without.teamPoints)
  })
})

describe('USA plan (BR-18)', () => {
  it('qualifies levels 1–3 on DT (CT + own purchases)', () => {
    const result = computeCommission({ ...solo(60), personalTurnover: 50 }, US)
    expect(result.volumes.dt).toBe(110)
    expect(result.level).toBe(1)
    expect(result.ownVolume).toBe(110)
  })

  it('requires CT ≥ 330 from level 4, whatever the DT', () => {
    expect(computeCommission({ ...directOnly(300, [10000, 3000]), personalTurnover: 200 }, US).level).toBe(3)
    expect(computeCommission(directOnly(330, [10000, 3000]), US).level).toBe(4)
  })

  it('ignores personal turnover outside the USA plan', () => {
    expect(computeCommission({ ...solo(60), personalTurnover: 50 }, ES).level).toBeNull()
  })
})

describe('markets (BR-14, BR-16)', () => {
  it('converts the same points with each market factor', () => {
    expect(computeCommission(solo(1000), market('FR-vdi')).amount).toBe(474.24)
    expect(computeCommission(solo(1000), market('IT-partitaIva')).amount).toBe(487.89)
    expect(computeCommission(solo(1000), market('CH')).amount).toBe(468)
    expect(computeCommission(solo(1000), market('HU')).amount).toBe(210600)
  })

  it('reports an unknown payout where the threshold is not documented (Q-04)', () => {
    expect(computeCommission(solo(1000), market('PL')).payout).toBe('unknown')
  })

  it('pays above 1,700 MXN by transfer and below as a voucher in Mexico', () => {
    expect(computeCommission(solo(300), MX).payout).toBe('voucher') // 57 × 26 = 1,482
    expect(computeCommission(solo(400), MX).payout).toBe('transfer') // 116 × 26 = 3,016
  })
})
