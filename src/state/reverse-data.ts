import type { Plan } from '../domain/planning'
import { parsePoints, type LegDraft } from './partner-data'
import type { PlanData } from './plan-data'
import { isLeg } from './session-storage'

/**
 * Tab 3 «Ingeniería inversa» inputs: the target commission, the own CT the partner is willing to
 * make, and her team, leg by leg or as a number of legs with an average. Independent of the other
 * tabs; prefilled from the plan of tab 2 when there is one.
 */
export const REVERSE_STORAGE_KEY = 'tcg-commission-calculator/reverse/v1'

export type TeamMode = 'legs' | 'average'

export interface ReverseData {
  readonly target: string
  readonly willingOwn: string
  readonly mode: TeamMode
  /** `volume` = the points she expects from that leg. */
  readonly legs: readonly LegDraft[]
  readonly legCount: string
  readonly average: string
}

/** Legs of the plan for tab 3; fictitious partners (D-024) only when asked. */
export function legsFromPlan(plan: PlanData, includeFictitious: boolean): LegDraft[] {
  return plan.legs.filter((leg) => includeFictitious || leg.fictitious !== true).map(({ id, alias, volume }) => ({ id, alias, volume }))
}

export function initialReverseData(plan?: PlanData | null): ReverseData {
  return {
    target: '',
    willingOwn: plan?.ownForecast ?? '',
    mode: 'legs',
    legs: plan ? legsFromPlan(plan, true) : [],
    legCount: '',
    average: '',
  }
}

export function isEmptyReverseData(data: ReverseData): boolean {
  return [data.target, data.willingOwn, data.legCount, data.average].every((raw) => raw.trim() === '') && data.legs.length === 0
}

export function isReverseData(value: unknown): value is ReverseData {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return (
    typeof data.target === 'string' &&
    typeof data.willingOwn === 'string' &&
    (data.mode === 'legs' || data.mode === 'average') &&
    Array.isArray(data.legs) &&
    data.legs.every(isLeg) &&
    typeof data.legCount === 'string' &&
    typeof data.average === 'string'
  )
}

export interface ParsedReverse {
  readonly target: number
  readonly plan: Plan
  /** Average points per leg (for «más socias»): the given average, or the mean of the legs. */
  readonly average: number
  readonly invalid: readonly string[]
}

/** Up to 30 legs in average mode. */
export const MAX_AVERAGE_LEGS = 30

export function parseReverseData(data: ReverseData, generationShares?: readonly number[]): ParsedReverse {
  const invalid: string[] = []
  const read = (raw: string, field: string) => {
    const points = parsePoints(raw)
    if (points === null) invalid.push(field)
    return points ?? 0
  }
  const target = read(data.target, 'target')
  const ownCt = read(data.willingOwn, 'willingOwn')
  let legs: number[]
  let average: number
  if (data.mode === 'average') {
    const count = Math.min(MAX_AVERAGE_LEGS, Math.floor(read(data.legCount, 'legCount')))
    average = read(data.average, 'average')
    legs = Array.from({ length: count }, () => average)
  } else {
    legs = data.legs.map((leg, index) => read(leg.volume, `leg-${index}`))
    average = legs.length > 0 ? Math.round((legs.reduce((a, b) => a + b, 0) / legs.length) * 100) / 100 : 0
  }
  return { target, plan: { ownCt, legs, ...(generationShares ? { generationShares } : {}) }, average, invalid }
}
