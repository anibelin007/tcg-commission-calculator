import { attainedLevel } from './level'
import type { Market } from './markets'
import { PLANS, levelDefinition, type TargetLevel } from './plans'
import { cleanPoints, roundAmount } from './money'
import {
  DEFAULT_STRONGEST_TEAM_LIMIT,
  STRONGEST_TEAM_LIMITS,
  type StrongestTeamLimitId,
} from './strongest-team-limit'
import { computeVolumes, strongestTeamIndex, sum, type CommissionInput, type Volumes } from './volumes'

export interface CommissionOptions {
  /** How the strongest-team limit is applied (Q-01). Defaults to the provisional D-005. */
  readonly strongestTeamLimit?: StrongestTeamLimitId
}

export interface GenerationResult {
  /** 1-based generation. */
  readonly generation: number
  /** Volume of this generation across all teams. */
  readonly volume: number
  readonly rate: number
  /** Commission points before the strongest-team limit. */
  readonly points: number
}

/** The strongest team, reported when it exceeds the limit of the attained level (BR-12). */
export interface StrongestTeamResult {
  /** Index of the team in `teamVolumes`. */
  readonly index: number
  readonly volume: number
  readonly limit: number
  /**
   * `applied`: the limit was applied with the team's breakdown by generation.
   * `breakdownMissing`: the team exceeds the limit but its breakdown was not given, so the
   * result does not include the limit yet.
   */
  readonly status: 'applied' | 'breakdownMissing'
  /** Commission points from the team before and after the limit (null when the breakdown is missing). */
  readonly pointsBefore: number | null
  readonly pointsAfter: number | null
}

/** Input inconsistencies worth showing to the user; the calculation still runs. */
export type InputWarning =
  /** There is downline volume but no direct partner's VE: TT-1/2/3 equal TT and the level may be too high. */
  | 'teamVolumesMissing'
  /** The VE of the direct partners add up to more than all generations together. */
  | 'teamVolumesExceedDownline'
  /** The strongest-team breakdown does not add up to that team's VE. */
  | 'breakdownDoesNotMatchTeam'
  /** A generation of the strongest-team breakdown is larger than the whole generation. */
  | 'breakdownExceedsGeneration'

/** `transfer`: paid to the bank account; `voucher`: paid as a webshop voucher (BR-16). */
export type Payout = 'transfer' | 'voucher' | 'unknown' | 'none'

export interface CommissionResult {
  readonly planId: Market['plan']
  readonly marketId: string
  readonly volumes: Volumes
  /** Null below level 1: no commission (BR-09). */
  readonly level: TargetLevel | null
  /** Own volume used for the own commission (CT, or DT in the USA plan). */
  readonly ownVolume: number
  readonly ownRate: number
  readonly ownPoints: number
  readonly generations: readonly GenerationResult[]
  /** Present when the strongest team exceeds the limit of the attained level. */
  readonly strongestTeam: StrongestTeamResult | null
  readonly warnings: readonly InputWarning[]
  /** Team commission points after the limit. */
  readonly teamPoints: number
  readonly totalPoints: number
  readonly currency: Market['currency']
  readonly pointsFactor: number
  /** Amount in the local currency, rounded to the minor unit (BR-17). */
  readonly amount: number
  readonly payout: Payout
}

function payoutFor(amount: number, market: Market): Payout {
  if (amount <= 0) return 'none'
  if (market.payoutThreshold === null) return 'unknown'
  return amount > market.payoutThreshold ? 'transfer' : 'voucher'
}

const TOLERANCE = 0.01

function inputWarnings(input: CommissionInput, volumes: Volumes, strongest: number): InputWarning[] {
  const warnings: InputWarning[] = []
  if (volumes.downline > 0 && input.teamVolumes.length === 0) warnings.push('teamVolumesMissing')
  if (sum(input.teamVolumes) > volumes.downline + TOLERANCE) warnings.push('teamVolumesExceedDownline')
  const breakdown = input.strongestTeamGenerations
  if (breakdown && breakdown.length > 0 && strongest >= 0) {
    if (Math.abs(sum(breakdown) - volumes.teamVolumes[strongest]!) > TOLERANCE) warnings.push('breakdownDoesNotMatchTeam')
    if (breakdown.some((volume, index) => volume > (input.generationVolumes[index] ?? 0) + TOLERANCE)) {
      warnings.push('breakdownExceedsGeneration')
    }
  }
  return warnings
}

/**
 * Base commission of one statement month (BR-13): own commission plus team commission by
 * generation, with the strongest-team limit, converted with the market's points factor.
 * Bonuses are out of scope (D-004).
 */
export function computeCommission(input: CommissionInput, market: Market, options: CommissionOptions = {}): CommissionResult {
  const plan = PLANS[market.plan]
  const volumes = computeVolumes(plan, input)
  const level = attainedLevel(plan, volumes)
  const strongest = strongestTeamIndex(volumes)
  const base = {
    planId: plan.id,
    marketId: market.id,
    volumes,
    level,
    ownVolume: volumes.own,
    currency: market.currency,
    pointsFactor: market.pointsFactor,
    warnings: inputWarnings(input, volumes, strongest),
  }

  if (level === null) {
    return { ...base, ownRate: 0, ownPoints: 0, generations: [], strongestTeam: null, teamPoints: 0, totalPoints: 0, amount: 0, payout: 'none' }
  }

  const definition = levelDefinition(plan, level)
  const rates = definition.generationRates
  const pointsOf = (generationVolumes: readonly number[]) =>
    rates.reduce((total, rate, index) => total + (generationVolumes[index] ?? 0) * rate, 0)

  const generations: GenerationResult[] = rates.map((rate, index) => {
    const volume = input.generationVolumes[index] ?? 0
    return { generation: index + 1, volume, rate, points: cleanPoints(volume * rate) }
  })
  let teamPoints = pointsOf(input.generationVolumes)

  // The limit can only reduce points when the team volume exceeds it: a team's commission
  // points are always below its volume (rates ≤ 14 %), so both strategies agree on when.
  let strongestTeam: StrongestTeamResult | null = null
  const limit = definition.strongestTeamLimit
  const strongestVolume = volumes.teamVolumes[strongest]
  if (limit !== null && strongestVolume !== undefined && strongestVolume > limit) {
    const breakdown = input.strongestTeamGenerations
    if (breakdown && breakdown.length > 0) {
      const pointsBefore = pointsOf(breakdown)
      const strategy = STRONGEST_TEAM_LIMITS[options.strongestTeamLimit ?? DEFAULT_STRONGEST_TEAM_LIMIT]
      const pointsAfter = strategy({ teamPoints: pointsBefore, teamVolume: strongestVolume, limit })
      teamPoints += pointsAfter - pointsBefore
      strongestTeam = { index: strongest, volume: strongestVolume, limit, status: 'applied', pointsBefore: cleanPoints(pointsBefore), pointsAfter: cleanPoints(pointsAfter) }
    } else {
      strongestTeam = { index: strongest, volume: strongestVolume, limit, status: 'breakdownMissing', pointsBefore: null, pointsAfter: null }
    }
  }

  const ownPoints = volumes.own * definition.ownRate
  const totalPoints = cleanPoints(ownPoints + teamPoints)
  const amount = roundAmount(totalPoints * market.pointsFactor)

  return {
    ...base,
    ownRate: definition.ownRate,
    ownPoints: cleanPoints(ownPoints),
    generations,
    strongestTeam,
    teamPoints: cleanPoints(teamPoints),
    totalPoints,
    amount,
    payout: payoutFor(amount, market),
  }
}
