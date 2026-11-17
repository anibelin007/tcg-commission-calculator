import type { CommissionInput } from '../domain/commission'

/**
 * The partner's real data, entered once in «Mi comisión actual» and read by every tab
 * (D-019). Raw field values, shaped like the Online Office (Q-12). Simulations never modify
 * it: they build hypothetical inputs from it.
 */

/** Generation fields: 1–9 earn commission, the 10th holds generation 10 and deeper. */
export const MAX_GENERATION_FIELDS = 10
export const INITIAL_GENERATION_FIELDS = 5

/** A direct partner and her whole team (*pata*). */
export interface LegDraft {
  /** Stable ID, independent of the position in the list. */
  readonly id: string
  /** First name or nickname chosen by the partner; may be empty. Never sent anywhere. */
  readonly alias: string
  /** VE of the leg, as in the Online Office list of direct partners. */
  readonly volume: string
}

export interface PartnerData {
  readonly marketId: string
  readonly customerTurnover: string
  readonly personalTurnover: string
  /** «Estructura de equipo»: points per generation, index 0 = generation 1. */
  readonly generations: readonly string[]
  readonly legs: readonly LegDraft[]
  /** Points by generation of the strongest leg; only used by a strongest-team limit strategy (D-005). */
  readonly breakdown: readonly string[]
}

export type FieldId =
  | 'customerTurnover'
  | 'personalTurnover'
  | `generation-${number}`
  | `leg-${number}`
  | `breakdown-${number}`

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
    legs: [],
    breakdown: empty(INITIAL_GENERATION_FIELDS),
  }
}

export function newLeg(id: string): LegDraft {
  return { id, alias: '', volume: '' }
}

/** True when nothing has been entered yet (the other tabs then ask to fill in the data first). */
export function isEmptyPartnerData(data: PartnerData): boolean {
  return (
    [data.customerTurnover, data.personalTurnover, ...data.generations].every((raw) => raw.trim() === '') &&
    data.legs.every((leg) => leg.volume.trim() === '')
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
  const breakdown = data.breakdown.map((raw, index) => read(raw, `breakdown-${index}`))
  return {
    input: {
      customerTurnover: read(data.customerTurnover, 'customerTurnover'),
      personalTurnover: read(data.personalTurnover, 'personalTurnover'),
      generationVolumes: data.generations.map((raw, index) => read(raw, `generation-${index}`)),
      teamVolumes: data.legs.map((leg, index) => read(leg.volume, `leg-${index}`)),
      // An untouched breakdown means «not given».
      ...(data.breakdown.some((raw) => raw.trim() !== '') ? { strongestTeamGenerations: breakdown } : {}),
    },
    invalid,
  }
}

/** Adds a generation field to the generations and to the breakdown, up to the maximum. */
export function addGeneration(data: PartnerData): PartnerData {
  if (data.generations.length >= MAX_GENERATION_FIELDS) return data
  return { ...data, generations: [...data.generations, ''], breakdown: [...data.breakdown, ''] }
}
