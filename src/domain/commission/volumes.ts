import type { OwnMeasure, Plan, TeamMeasure } from './plans'

/**
 * One team (*pata*): a first-generation partner and her whole downline. `generations[0]` is
 * the volume of generation 1 (the direct partner herself), `generations[1]` of generation 2,
 * and so on, relative to the partner using the calculator. Generations beyond 9 may be given:
 * they count for TT but never earn commission (BR-05, BR-11).
 * Volumes are CT in the EU and MX plans and DT in the USA plan.
 */
export interface TeamInput {
  readonly generations: readonly number[]
}

export interface CommissionInput {
  /** CT: customer turnover, including own orders in EU/MX (BR-04). */
  readonly customerTurnover: number
  /** PT: own purchases. USA plan only (BR-18); must be 0 elsewhere. */
  readonly personalTurnover?: number
  readonly teams: readonly TeamInput[]
}

export interface Volumes {
  readonly ct: number
  readonly dt: number
  /** Volume of each team (the team's TT), in input order. */
  readonly teamVolumes: readonly number[]
  readonly tt: number
  readonly tt1: number
  readonly tt2: number
  readonly tt3: number
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)

export function teamVolume(team: TeamInput): number {
  return sum(team.generations)
}

/** TT = own volume + volume of all teams; TT-n = TT minus the n strongest teams (BR-05, BR-06). */
export function computeVolumes(plan: Plan, input: CommissionInput): Volumes {
  const ct = input.customerTurnover
  const dt = ct + (plan.ownMeasure === 'dt' ? (input.personalTurnover ?? 0) : 0)
  const own = plan.ownMeasure === 'dt' ? dt : ct
  const teamVolumes = input.teams.map(teamVolume)
  const tt = own + sum(teamVolumes)
  const strongestFirst = [...teamVolumes].sort((a, b) => b - a)
  const minusStrongest = (n: number) => tt - sum(strongestFirst.slice(0, n))
  return { ct, dt, teamVolumes, tt, tt1: minusStrongest(1), tt2: minusStrongest(2), tt3: minusStrongest(3) }
}

export function ownMeasureValue(volumes: Volumes, measure: OwnMeasure): number {
  return measure === 'dt' ? volumes.dt : volumes.ct
}

export function teamMeasureValue(volumes: Volumes, measure: TeamMeasure): number {
  return volumes[measure]
}

/** Index of the strongest team (highest volume; the first one on a tie), or -1 without teams. */
export function strongestTeamIndex(volumes: Volumes): number {
  let best = -1
  volumes.teamVolumes.forEach((volume, index) => {
    if (best === -1 || volume > volumes.teamVolumes[best]!) best = index
  })
  return best
}
