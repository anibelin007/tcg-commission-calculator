import type { OwnMeasure, Plan, TeamMeasure } from './plans'

/**
 * Engine input, shaped like the RINGANA Online Office (Q-12, S-13):
 * - «Estadísticas → Estructura de equipo» gives the points of each generation → commission;
 * - the list of direct partners gives each one's VE (= the volume of her team) → TT-1/2/3.
 * Volumes are CT in the EU and MX plans and DT in the USA plan.
 */
export interface CommissionInput {
  /** CT: customer turnover as shown by the Online Office (VC); it already includes own consumption (BR-04, Q-16). */
  readonly customerTurnover: number
  /** PT: own purchases. USA plan only (BR-18); ignored elsewhere. */
  readonly personalTurnover?: number
  /**
   * Points of the whole downline by generation: index 0 = generation 1 (direct partners).
   * Generations beyond 9 may be given (or summed in the last entry): they count for TT but
   * never earn commission (BR-05, BR-11).
   */
  readonly generationVolumes: readonly number[]
  /** VE of each direct partner, i.e. the volume of each team (*pata*). Used for TT-n and the limit. */
  readonly teamVolumes: readonly number[]
  /**
   * Points by generation of the strongest team only, relative to the calculating partner
   * (index 0 = the direct partner herself). Needed only when that team exceeds the limit of the
   * attained level (BR-12); otherwise ignored.
   */
  readonly strongestTeamGenerations?: readonly number[]
}

export interface Volumes {
  readonly ct: number
  readonly dt: number
  /** Own volume that counts for TT and earns the own commission (CT, or DT in the USA plan). */
  readonly own: number
  readonly downline: number
  readonly teamVolumes: readonly number[]
  readonly tt: number
  readonly tt1: number
  readonly tt2: number
  readonly tt3: number
}

export const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)

/** TT = own volume + all downline generations; TT-n = TT minus the n strongest teams (BR-05, BR-06). */
export function computeVolumes(plan: Plan, input: CommissionInput): Volumes {
  const ct = input.customerTurnover
  const dt = ct + (plan.ownMeasure === 'dt' ? (input.personalTurnover ?? 0) : 0)
  const own = plan.ownMeasure === 'dt' ? dt : ct
  const downline = sum(input.generationVolumes)
  const tt = own + downline
  const strongestFirst = [...input.teamVolumes].sort((a, b) => b - a)
  const minusStrongest = (n: number) => tt - sum(strongestFirst.slice(0, n))
  return { ct, dt, own, downline, teamVolumes: input.teamVolumes, tt, tt1: minusStrongest(1), tt2: minusStrongest(2), tt3: minusStrongest(3) }
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
