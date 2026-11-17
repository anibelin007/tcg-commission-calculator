import { TARGET_LEVELS, type TargetLevel } from '../domain/commission'
import type { Plan } from '../domain/planning'
import { parsePoints, type LegDraft } from './partner-data'
import { isLeg } from './session-storage'

/**
 * Tab 2 «Planificar mi meta»: target level first, then what the partner and each leg expect to
 * make this month (forecast) and, optionally, what they have made so far (done).
 */
export const PLAN_STORAGE_KEY = 'tcg-commission-calculator/plan/v1'

/** A leg in the plan: `volume` is her forecast VE, `done` what she has made so far. */
export interface PlanLeg extends LegDraft {
  readonly done: string
  /** A partner who has not joined yet (planned); missing in plans stored before D-024. */
  readonly fictitious?: boolean
}

/** Number of planned partners who have not joined yet. */
export function fictitiousLegCount(data: PlanData): number {
  return data.legs.filter((leg) => leg.fictitious === true).length
}

export interface PlanData {
  /** '' until chosen, else '1'…'10'. */
  readonly target: string
  readonly ownForecast: string
  readonly ownDone: string
  readonly legs: readonly PlanLeg[]
}

export function initialPlanData(): PlanData {
  return { target: '', ownForecast: '', ownDone: '', legs: [] }
}

export function isEmptyPlanData(data: PlanData): boolean {
  return data.target === '' && data.ownForecast.trim() === '' && data.ownDone.trim() === '' && data.legs.length === 0
}

export function isPlanData(value: unknown): value is PlanData {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return (
    typeof data.target === 'string' &&
    typeof data.ownForecast === 'string' &&
    typeof data.ownDone === 'string' &&
    Array.isArray(data.legs) &&
    data.legs.every((leg) => {
      if (!isLeg(leg)) return false
      const extra = leg as unknown as { done?: unknown; fictitious?: unknown }
      return typeof extra.done === 'string' && (extra.fictitious === undefined || typeof extra.fictitious === 'boolean')
    })
  )
}

export function targetLevelOf(data: PlanData): TargetLevel | null {
  const level = Number(data.target)
  return (TARGET_LEVELS as readonly number[]).includes(level) ? (level as TargetLevel) : null
}

export interface ParsedPlan {
  readonly plan: Plan
  readonly ownDone: number
  readonly legsDone: readonly number[]
  /** Field IDs with an invalid number: 'ownForecast', 'ownDone', `leg-${i}`, `legDone-${i}`. */
  readonly invalid: readonly string[]
}

export function parsePlanData(data: PlanData, generationShares?: readonly number[]): ParsedPlan {
  const invalid: string[] = []
  const read = (raw: string, field: string) => {
    const points = parsePoints(raw)
    if (points === null) invalid.push(field)
    return points ?? 0
  }
  return {
    plan: {
      ownCt: read(data.ownForecast, 'ownForecast'),
      legs: data.legs.map((leg, index) => read(leg.volume, `leg-${index}`)),
      ...(generationShares ? { generationShares } : {}),
    },
    ownDone: read(data.ownDone, 'ownDone'),
    legsDone: data.legs.map((leg, index) => read(leg.done, `legDone-${index}`)),
    invalid,
  }
}
