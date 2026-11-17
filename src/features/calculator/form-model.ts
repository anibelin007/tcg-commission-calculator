import type { CommissionInput } from '../../domain/commission'

/** Maximum number of generation fields per team: 1–9 earn commission, the 10th holds 10 and deeper. */
export const MAX_GENERATION_FIELDS = 10
export const INITIAL_GENERATION_FIELDS = 3

export interface TeamDraft {
  /** Stable key for React lists; not a business ID. */
  readonly key: number
  /** Raw field values, index 0 = generation 1. Index 9 = generations 10 and deeper. */
  readonly generations: readonly string[]
}

export interface FormState {
  readonly marketId: string
  readonly customerTurnover: string
  readonly personalTurnover: string
  readonly teams: readonly TeamDraft[]
}

export type FieldId = 'customerTurnover' | 'personalTurnover' | `team-${number}-generation-${number}`

export interface ParsedForm {
  readonly input: CommissionInput
  /** Fields with a value that is not a valid number of points (negative or not a number). */
  readonly invalid: readonly FieldId[]
}

/**
 * Field value → points. Empty means 0. Inputs are `type="number"`, so the browser already
 * normalises the decimal separator; anything else is invalid.
 */
export function parsePoints(raw: string): number | null {
  const value = raw.trim()
  if (value === '') return 0
  const points = Number(value)
  return Number.isFinite(points) && points >= 0 ? points : null
}

export function initialFormState(marketId: string): FormState {
  return { marketId, customerTurnover: '', personalTurnover: '', teams: [] }
}

export function newTeam(key: number): TeamDraft {
  return { key, generations: Array.from({ length: INITIAL_GENERATION_FIELDS }, () => '') }
}

/** Converts the form into engine input. Invalid fields count as 0 and are reported. */
export function parseForm(state: FormState): ParsedForm {
  const invalid: FieldId[] = []
  const read = (raw: string, field: FieldId) => {
    const points = parsePoints(raw)
    if (points === null) invalid.push(field)
    return points ?? 0
  }
  const customerTurnover = read(state.customerTurnover, 'customerTurnover')
  const personalTurnover = read(state.personalTurnover, 'personalTurnover')
  const teams = state.teams.map((team, teamIndex) => ({
    generations: team.generations.map((raw, generationIndex) =>
      read(raw, `team-${teamIndex}-generation-${generationIndex}`),
    ),
  }))
  return { input: { customerTurnover, personalTurnover, teams }, invalid }
}
