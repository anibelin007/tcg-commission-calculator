import { attainedLevel } from './level'
import type { Market } from './markets'
import { PLANS, levelDefinition, type TargetLevel } from './plans'
import { cleanPoints, roundAmount } from './money'
import {
  DEFAULT_STRONGEST_TEAM_LIMIT,
  STRONGEST_TEAM_LIMITS,
  type StrongestTeamLimitId,
} from './strongest-team-limit'
import { computeVolumes, strongestTeamIndex, type CommissionInput, type Volumes } from './volumes'

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

export interface StrongestTeamResult {
  /** Index of the team in the input. */
  readonly index: number
  readonly volume: number
  readonly limit: number
  /** Commission points from the team before and after the limit. */
  readonly pointsBefore: number
  readonly pointsAfter: number
}

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
  /** Present when the level has a limit and the user has at least one team. */
  readonly strongestTeam: StrongestTeamResult | null
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

/**
 * Base commission of one statement month (BR-13): own commission plus team commission by
 * generation, with the strongest-team limit, converted with the market's points factor.
 * Bonuses are out of scope (D-004).
 */
export function computeCommission(input: CommissionInput, market: Market, options: CommissionOptions = {}): CommissionResult {
  const plan = PLANS[market.plan]
  const volumes = computeVolumes(plan, input)
  const level = attainedLevel(plan, volumes)
  const ownVolume = plan.ownMeasure === 'dt' ? volumes.dt : volumes.ct
  const base = {
    planId: plan.id,
    marketId: market.id,
    volumes,
    level,
    ownVolume,
    currency: market.currency,
    pointsFactor: market.pointsFactor,
  }

  if (level === null) {
    return { ...base, ownRate: 0, ownPoints: 0, generations: [], strongestTeam: null, teamPoints: 0, totalPoints: 0, amount: 0, payout: 'none' }
  }

  const definition = levelDefinition(plan, level)
  const rates = definition.generationRates
  const pointsOfTeam = (generations: readonly number[]) =>
    rates.reduce((total, rate, index) => total + (generations[index] ?? 0) * rate, 0)

  const generations: GenerationResult[] = rates.map((rate, index) => {
    const volume = input.teams.reduce((total, team) => total + (team.generations[index] ?? 0), 0)
    return { generation: index + 1, volume, rate, points: cleanPoints(volume * rate) }
  })

  const teamPointsBefore = input.teams.map((team) => pointsOfTeam(team.generations))
  let teamPoints = teamPointsBefore.reduce((total, points) => total + points, 0)

  let strongestTeam: StrongestTeamResult | null = null
  const strongest = strongestTeamIndex(volumes)
  if (definition.strongestTeamLimit !== null && strongest >= 0) {
    const pointsBefore = teamPointsBefore[strongest]!
    const limitStrategy = STRONGEST_TEAM_LIMITS[options.strongestTeamLimit ?? DEFAULT_STRONGEST_TEAM_LIMIT]
    const pointsAfter = limitStrategy({
      teamPoints: pointsBefore,
      teamVolume: volumes.teamVolumes[strongest]!,
      limit: definition.strongestTeamLimit,
    })
    teamPoints += pointsAfter - pointsBefore
    strongestTeam = {
      index: strongest,
      volume: volumes.teamVolumes[strongest]!,
      limit: definition.strongestTeamLimit,
      pointsBefore: cleanPoints(pointsBefore),
      pointsAfter: cleanPoints(pointsAfter),
    }
  }

  const ownPoints = ownVolume * definition.ownRate
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
