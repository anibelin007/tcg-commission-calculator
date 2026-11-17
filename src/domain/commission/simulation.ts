import { computeCommission, type CommissionOptions, type CommissionResult } from './commission'
import type { Market } from './markets'
import { PLANS, TARGET_LEVELS, levelDefinition, type OwnMeasure, type TargetLevel, type TeamMeasure } from './plans'
import { computeVolumes, ownMeasureValue, teamMeasureValue, type CommissionInput } from './volumes'

/**
 * Simulations on top of the engine (PF-02 to PF-04). They change only the partner's own
 * customer turnover and keep the team as entered: own points are what she controls this
 * month, and new partners only count for her next month (BR-23).
 * Results are estimates; the UI words them as «you would need», never «you will earn» (BR-21).
 */

/** Points have two decimals: round a needed amount up to the next hundredth. */
function ceilPoints(value: number): number {
  return Math.ceil(Math.round(value * 1e6) / 1e4) / 100
}

function withExtraOwn(input: CommissionInput, extra: number): CommissionInput {
  return { ...input, customerTurnover: input.customerTurnover + extra }
}

export interface PathGap {
  /** Own volume still missing for this path (0 when met). */
  readonly own: { readonly measure: OwnMeasure; readonly min: number; readonly missing: number }
  /** Team volume still missing for this path, when the path has a team criterion. */
  readonly team?: { readonly measure: TeamMeasure; readonly min: number; readonly missing: number }
  /**
   * Extra own customer turnover that would meet this path alone. Own points also raise TT and
   * TT-1/2/3 (they are part of them), so one number covers both criteria.
   */
  readonly extraOwnAlone: number
}

export interface NextLevelSimulation {
  readonly level: TargetLevel
  /** One entry per way of qualifying (levels 2 and 3 have two). */
  readonly paths: readonly PathGap[]
  /** Smallest extra own customer turnover that reaches this level, keeping the team. */
  readonly extraOwn: number
  /** Result with that extra own turnover. */
  readonly result: CommissionResult
}

/** What is missing for the next target level (PF-02). Null at level 10. */
export function simulateNextLevel(input: CommissionInput, market: Market, options: CommissionOptions = {}): NextLevelSimulation | null {
  const current = computeCommission(input, market, options)
  const next = TARGET_LEVELS.find((level) => level > (current.level ?? 0))
  if (next === undefined) return null
  const plan = PLANS[market.plan]
  const volumes = computeVolumes(plan, input)
  const paths: PathGap[] = levelDefinition(plan, next).qualification.map((path) => {
    const ownMissing = Math.max(0, path.own.min - ownMeasureValue(volumes, path.own.measure))
    const teamMissing = path.team ? Math.max(0, path.team.min - teamMeasureValue(volumes, path.team.measure)) : 0
    return {
      own: { ...path.own, missing: ceilPoints(ownMissing) },
      ...(path.team ? { team: { ...path.team, missing: ceilPoints(teamMissing) } } : {}),
      extraOwnAlone: ceilPoints(Math.max(ownMissing, teamMissing)),
    }
  })
  const extraOwn = Math.min(...paths.map((path) => path.extraOwnAlone))
  return { level: next, paths, extraOwn, result: computeCommission(withExtraOwn(input, extraOwn), market, options) }
}

export interface TargetAmountSimulation {
  /** Extra own customer turnover needed (0 when the target is already reached). */
  readonly extraOwn: number
  readonly result: CommissionResult
}

const SEARCH_LIMIT = 10_000_000

/**
 * Smallest `extra` (to the hundredth of a point) for which `inputWith(extra)` reaches an
 * estimated commission of at least `amount`. The commission never decreases when points are
 * added, so a binary search is exact. Null if not reachable.
 */
function smallestExtra(
  inputWith: (extra: number) => CommissionInput,
  market: Market,
  amount: number,
  options: CommissionOptions,
): { extra: number; result: CommissionResult } | null {
  const resultWith = (hundredths: number) => computeCommission(inputWith(hundredths / 100), market, options)
  if (resultWith(0).amount >= amount) return { extra: 0, result: resultWith(0) }
  if (resultWith(SEARCH_LIMIT * 100).amount < amount) return null
  let low = 0 // in hundredths of a point: not enough
  let high = SEARCH_LIMIT * 100 // enough
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (resultWith(middle).amount >= amount) high = middle
    else low = middle
  }
  return { extra: high / 100, result: resultWith(high) }
}

/**
 * Smallest extra own customer turnover for an estimated commission of at least `amount`,
 * keeping the team as entered (PF-03). Null if not reachable.
 */
export function simulateTargetAmount(
  input: CommissionInput,
  market: Market,
  amount: number,
  options: CommissionOptions = {},
): TargetAmountSimulation | null {
  const found = smallestExtra((extra) => withExtraOwn(input, extra), market, amount, options)
  return found && { extraOwn: found.extra, result: found.result }
}

/**
 * Adds team points in generation 1 from direct partners who are not among the strongest teams:
 * they raise the team commission at the generation-1 rate and TT, TT-1, TT-2 and TT-3 alike.
 * (Points of the strongest teams would not raise TT-n, so they are not assumed.) The engine
 * treats downline volume that is not in `teamVolumes` exactly like that.
 */
function withExtraTeam(input: CommissionInput, extra: number): CommissionInput {
  const [first = 0, ...rest] = input.generationVolumes
  return { ...input, generationVolumes: [first + extra, ...rest] }
}

export interface TeamTargetSimulation {
  /** Extra team points needed in generation 1, outside the strongest teams (0 when already reached). */
  readonly extraTeam: number
  readonly result: CommissionResult
}

/**
 * Smallest extra team volume for an estimated commission of at least `amount`, keeping the
 * partner's own CT (PF-03, team route). Assumes the points come from generation 1 outside the
 * strongest teams (see `withExtraTeam`); the UI states that assumption. Null if not reachable.
 */
export function simulateTargetAmountWithTeam(
  input: CommissionInput,
  market: Market,
  amount: number,
  options: CommissionOptions = {},
): TeamTargetSimulation | null {
  if (computeCommission(input, market, options).level === null) return null // no team commission below level 1
  const found = smallestExtra((extra) => withExtraTeam(input, extra), market, amount, options)
  return found && { extraTeam: found.extra, result: found.result }
}

export interface StepPoint {
  /** Own customer turnover. */
  readonly ownTurnover: number
  readonly amount: number
  readonly level: TargetLevel | null
}

/**
 * Commission against own customer turnover from 0 to `maxOwn`, team unchanged (PF-04).
 * Includes the exact jump points (the last value before and the first value of each new level)
 * so the chart shows the steps sharply.
 */
export function commissionCurve(input: CommissionInput, market: Market, maxOwn: number, options: CommissionOptions = {}): StepPoint[] {
  const at = (ownTurnover: number): StepPoint => {
    const result = computeCommission({ ...input, customerTurnover: ownTurnover }, market, options)
    return { ownTurnover, amount: result.amount, level: result.level }
  }
  const base = { ...input, customerTurnover: 0 }
  const points: StepPoint[] = [at(0)]
  let cursor = 0
  while (cursor < maxOwn) {
    const next = simulateNextLevel({ ...base, customerTurnover: cursor }, market, options)
    const jump = next ? cursor + next.extraOwn : Infinity
    if (!next || jump > maxOwn || jump <= cursor) break
    points.push(at(Math.max(0, jump - 0.01)), at(jump))
    cursor = jump
  }
  points.push(at(maxOwn))
  return points
}
