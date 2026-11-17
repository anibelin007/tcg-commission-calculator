import type { CommissionInput } from '../domain/commission'

/**
 * The partner's real data (tab 1 «Mi comisión actual»), as in the Online Office: CT, points
 * per generation and her TT-1/2/3 (design §7). Imported from the Office when available, else
 * typed in (D-018). Raw field values, shaped like the Online Office (Q-12). Simulations never modify
 * it: they build hypothetical inputs from it.
 */

/** Generation fields: 1–9 earn commission, the 10th holds generation 10 and deeper. */
export const MAX_GENERATION_FIELDS = 10
export const INITIAL_GENERATION_FIELDS = 5

/** A direct partner and her whole team (*pata*), used by the planning tabs. */
export interface LegDraft {
  /** Stable ID, independent of the position in the list. */
  readonly id: string
  /** First name or nickname chosen by the partner; may be empty. Never sent anywhere. */
  readonly alias: string
  /** Points of the leg (expected VE in the planning tabs). */
  readonly volume: string
}

export interface PartnerData {
  readonly marketId: string
  readonly customerTurnover: string
  readonly personalTurnover: string
  /** «Estructura de equipo»: points per generation, index 0 = generation 1. */
  readonly generations: readonly string[]
  /** VE-1, VE-2 and VE-3 from the partner's own row in the Online Office list of partners. */
  readonly ve1: string
  readonly ve2: string
  readonly ve3: string
}

export type FieldId =
  | 'customerTurnover'
  | 'personalTurnover'
  | `generation-${number}`
  | 've1'
  | 've2'
  | 've3'
  | `leg-${number}`

export interface ParsedPartnerData {
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

export function initialPartnerData(marketId: string): PartnerData {
  return {
    marketId,
    customerTurnover: '',
    personalTurnover: '',
    generations: empty(INITIAL_GENERATION_FIELDS),
    ve1: '',
    ve2: '',
    ve3: '',
  }
}

/** True when nothing has been entered yet (the other tabs then ask to fill in the data first). */
export function isEmptyPartnerData(data: PartnerData): boolean {
  return (
    [data.customerTurnover, data.personalTurnover, ...data.generations, data.ve1, data.ve2, data.ve3].every((raw) => raw.trim() === '')
  )
}

/** Converts the data into engine input. Invalid fields count as 0 and are reported. */
export function parsePartnerData(data: PartnerData): ParsedPartnerData {
  const invalid: FieldId[] = []
  const read = (raw: string, field: FieldId) => {
    const points = parsePoints(raw)
    if (points === null) invalid.push(field)
    return points ?? 0
  }
  const reported = (raw: string, field: 've1' | 've2' | 've3') => (raw.trim() === '' ? undefined : read(raw, field))
  return {
    input: {
      customerTurnover: read(data.customerTurnover, 'customerTurnover'),
      personalTurnover: read(data.personalTurnover, 'personalTurnover'),
      generationVolumes: data.generations.map((raw, index) => read(raw, `generation-${index}`)),
      teamVolumes: [],
      reportedTeamMinus: { tt1: reported(data.ve1, 've1'), tt2: reported(data.ve2, 've2'), tt3: reported(data.ve3, 've3') },
    },
    invalid,
  }
}

/** Adds a generation field, up to the maximum. */
export function addGeneration(data: PartnerData): PartnerData {
  if (data.generations.length >= MAX_GENERATION_FIELDS) return data
  return { ...data, generations: [...data.generations, ''] }
}
