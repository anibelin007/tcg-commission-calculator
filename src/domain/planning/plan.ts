import {
  PLANS,
  computeCommission,
  computeVolumes,
  levelDefinition,
  type CommissionInput,
  type CommissionResult,
  type Market,
  type TargetLevel,
} from '../commission'

/**
 * Planning (tabs 2 and 3, design §7): the partner's own CT and the VE she expects from each leg.
 * Legs only give team totals, not generations, so the commission of a plan is an **estimate**:
 * the legs' points are spread over generations like the real data of tab 1 (or all in
 * generation 1 when there is none).
 */
export interface Plan {
  readonly ownCt: number
  /** Expected VE of each leg. */
  readonly legs: readonly number[]
  /** Share of each generation in the downline (sums to 1). Default: all in generation 1. */
  readonly generationShares?: readonly number[]
}

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0)
const ceilHundredth = (value: number) => Math.ceil(Math.round(value * 1e6) / 1e4) / 100

/** Shares of each generation in real generation volumes, or undefined when they are all 0. */
export function generationShares(generationVolumes: readonly number[]): number[] | undefined {
  const total = sum(generationVolumes)
  return total > 0 ? generationVolumes.map((volume) => volume / total) : undefined
}

/** Engine input of a plan: own CT, the legs as teams, their total spread over generations. */
export function planToInput(plan: Plan): CommissionInput {
  const total = sum(plan.legs)
  const shares = plan.generationShares && plan.generationShares.length > 0 ? plan.generationShares : [1]
  return { customerTurnover: plan.ownCt, generationVolumes: shares.map((share) => total * share), teamVolumes: plan.legs }
}

export type Measure = 'ct' | 'dt' | 'tt' | 'tt1' | 'tt2' | 'tt3'

export interface RequirementCheck {
  readonly measure: Measure
  readonly min: number
  readonly actual: number
  /** Points still missing (0 when met). */
  readonly missing: number
}

export interface PathCheck {
  readonly requirements: readonly RequirementCheck[]
  readonly met: boolean
}

export interface TargetCheck {
  readonly target: TargetLevel
  /** One entry per way of qualifying (levels 2 and 3 have two). */
  readonly paths: readonly PathCheck[]
  readonly met: boolean
  /** Smallest own CT that reaches the target with the legs as planned. */
  readonly ownNeeded: number
  /** Estimated result of the plan as it is. */
  readonly result: CommissionResult
  /** Estimated result with `ownNeeded` own CT (same as `result` when the target is met). */
  readonly resultWithOwnNeeded: CommissionResult
}

/**
 * Compares a plan with a target level, requirement by requirement, and finds the own CT the
 * partner would need with her legs as planned. Exact: own CT raises TT and TT-n one to one,
 * while the legs' part does not depend on it.
 */
export function checkTarget(plan: Plan, market: Market, target: TargetLevel): TargetCheck {
  const input = planToInput(plan)
  const volumes = computeVolumes(PLANS[market.plan], input)
  const value = (measure: Measure) => volumes[measure]
  const paths: PathCheck[] = levelDefinition(PLANS[market.plan], target).qualification.map((path) => {
    const requirements: RequirementCheck[] = [path.own, ...(path.team ? [path.team] : [])].map(({ measure, min }) => ({
      measure,
      min,
      actual: value(measure),
      missing: ceilHundredth(Math.max(0, min - value(measure))),
    }))
    return { requirements, met: requirements.every((requirement) => requirement.missing === 0) }
  })
  const ownNeeded = Math.min(
    ...levelDefinition(PLANS[market.plan], target).qualification.map((path) => {
      const ownPart = path.own.min
      if (!path.team) return ownPart
      const fromLegs = value(path.team.measure) - volumes.own
      return Math.max(ownPart, path.team.min - fromLegs)
    }),
  )
  const neededCt = ceilHundredth(Math.max(plan.ownCt, ownNeeded))
  const result = computeCommission(input, market)
  return {
    target,
    paths,
    met: paths.some((path) => path.met),
    ownNeeded: ceilHundredth(ownNeeded),
    result,
    resultWithOwnNeeded: neededCt === plan.ownCt ? result : computeCommission({ ...input, customerTurnover: neededCt }, market),
  }
}

/**
 * How much the reached level exceeds its main requirement, as a fraction (0.25 = 25 %), like
 * the team planner sheet: the team measure of the first met path, or own CT when it has none.
 */
export function surplusOverLevel(plan: Plan, market: Market, level: TargetLevel): number {
  const check = checkTarget(plan, market, level)
  const met = check.paths.find((path) => path.met)
  if (!met) return 0
  const main = met.requirements.at(-1)!
  return main.min > 0 ? main.actual / main.min - 1 : 0
}

/** Calendar days left in the statement month, today included (the month closes on its last day). */
export function daysLeftInMonth(today: Date): number {
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return last - today.getDate() + 1
}

/** Points still missing for a forecast and the daily pace needed (0 when done). */
export function pace(forecast: number, done: number, daysLeft: number): { missing: number; perDay: number } {
  const missing = Math.max(0, Math.round((forecast - done) * 100) / 100)
  return { missing, perDay: daysLeft > 0 ? Math.round((missing / daysLeft) * 100) / 100 : missing }
}
