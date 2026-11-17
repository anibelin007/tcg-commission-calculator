import type { CommissionInput } from '../../domain/commission'

/** Generation fields: 1–9 earn commission, the 10th holds generation 10 and deeper. */
export const MAX_GENERATION_FIELDS = 10
export const INITIAL_GENERATION_FIELDS = 5

/** A direct partner's VE (= the volume of her team). `key` is only for React lists. */
export interface PartnerDraft {
  readonly key: number
  readonly volume: string
}

/** Raw field values, shaped like the Online Office (Q-12). */
export interface FormState {
  readonly marketId: string
  readonly customerTurnover: string
  readonly personalTurnover: string
  /** «Estructura de equipo»: points per generation, index 0 = generation 1. */
  readonly generations: readonly string[]
  /** List of direct partners: the VE of each one. */
  readonly partners: readonly PartnerDraft[]
  /** Points by generation of the strongest team; asked only when it exceeds the limit. */
  readonly breakdown: readonly string[]
}

export type FieldId =
  | 'customerTurnover'
  | 'personalTurnover'
  | `generation-${number}`
  | `partner-${number}`
  | `breakdown-${number}`

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

const empty = (count: number) => Array.from({ length: count }, () => '')

export function initialFormState(marketId: string): FormState {
  return {
    marketId,
    customerTurnover: '',
    personalTurnover: '',
    generations: empty(INITIAL_GENERATION_FIELDS),
    partners: [],
    breakdown: empty(INITIAL_GENERATION_FIELDS),
  }
}

/** Converts the form into engine input. Invalid fields count as 0 and are reported. */
export function parseForm(state: FormState): ParsedForm {
  const invalid: FieldId[] = []
  const read = (raw: string, field: FieldId) => {
    const points = parsePoints(raw)
    if (points === null) invalid.push(field)
    return points ?? 0
  }
  const breakdown = state.breakdown.map((raw, index) => read(raw, `breakdown-${index}`))
  return {
    input: {
      customerTurnover: read(state.customerTurnover, 'customerTurnover'),
      personalTurnover: read(state.personalTurnover, 'personalTurnover'),
      generationVolumes: state.generations.map((raw, index) => read(raw, `generation-${index}`)),
      teamVolumes: state.partners.map((partner, index) => read(partner.volume, `partner-${index}`)),
      // An untouched breakdown means «not given»: the engine then reports it as missing.
      ...(state.breakdown.some((raw) => raw.trim() !== '') ? { strongestTeamGenerations: breakdown } : {}),
    },
    invalid,
  }
}

/** Adds a generation field to the generations and to the breakdown, up to the maximum. */
export function addGeneration(state: FormState): FormState {
  if (state.generations.length >= MAX_GENERATION_FIELDS) return state
  return { ...state, generations: [...state.generations, ''], breakdown: [...state.breakdown, ''] }
}
