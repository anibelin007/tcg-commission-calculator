/**
 * How the limit for the strongest team (BR-12) reduces the commission earned from it.
 * How RINGANA applies it is pending verification (Q-01), so it is a replaceable strategy.
 */
export interface StrongestTeamLimitInput {
  /** Commission points earned from the team before the limit. */
  readonly teamPoints: number
  /** The team's volume (TT of the team, all generations). */
  readonly teamVolume: number
  readonly limit: number
}

export type StrongestTeamLimitId = 'none' | 'teamVolumeProportional' | 'commissionPoints'

export type StrongestTeamLimit = (input: StrongestTeamLimitInput) => number

export const STRONGEST_TEAM_LIMITS: Readonly<Record<StrongestTeamLimitId, StrongestTeamLimit>> = {
  /** PO decision 2026-11-17 (D-005): not applied until RINGANA's exact rule is confirmed. */
  none: ({ teamPoints }) => teamPoints,
  /**
   * Former provisional reading (BR-12a/b): when the team volume exceeds the limit, the
   * commission from the team is reduced in proportion (limit / team volume).
   */
  teamVolumeProportional: ({ teamPoints, teamVolume, limit }) =>
    teamVolume > limit ? (teamPoints * limit) / teamVolume : teamPoints,
  /**
   * Q-01 option (c), literal reading of EU-ES p. 11 («una vez calculado el porcentaje»): the
   * commission points from the team are capped at the limit. Matches the example on p. 15.
   */
  commissionPoints: ({ teamPoints, limit }) => Math.min(teamPoints, limit),
}

/** Strategy used by default until Q-01 is resolved (D-005). */
export const DEFAULT_STRONGEST_TEAM_LIMIT: StrongestTeamLimitId = 'none'
