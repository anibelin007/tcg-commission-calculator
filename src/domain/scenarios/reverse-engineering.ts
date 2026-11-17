import { computeCommission, simulateTargetAmount, type CommissionInput, type CommissionOptions, type CommissionResult, type Market } from '../commission'
import { ALLOCATION_STRATEGIES, allocate, type AllocationStrategy } from './allocation'
import { applyScenario, teamExtraOf, type Scenario } from './scenario'

/**
 * Reverse engineering (D-021, design §5): from a target commission to the extra points needed,
 * split between the partner (own CT) and her legs (generation-1 points).
 *
 * Guarantees and limits:
 * - The commission never decreases when own points or any leg's points grow, so a binary
 *   search along one allocation direction finds the minimum *in that direction*.
 * - «Solo yo» is the exact minimum of own CT. Team scenarios are **proposals**: the best of a
 *   few strategies and own-effort shares, not a proven global minimum.
 * - Every returned scenario has been evaluated with the engine and reaches the target.
 */

export type ScenarioKind = 'ownOnly' | 'balanced' | 'moreTeam' | 'manual'

/** Why a scenario cannot reach the target. */
export type Infeasibility =
  /** No legs entered: there is no team to add points to. */
  | 'noLegs'
  /** Own CT below level 1: without it there is no commission at all, whatever the team does. */
  | 'ownBelowLevel1'
  /** Not reachable within the search range. */
  | 'unreachable'

export interface EvaluatedScenario {
  readonly kind: ScenarioKind
  readonly scenario: Scenario
  /** Allocation strategy used for the team points (null without team points). */
  readonly strategy: AllocationStrategy | null
  readonly ownExtra: number
  readonly teamExtra: number
  readonly result: CommissionResult
  /** Estimated commission minus the target (≥ 0). */
  readonly difference: number
  /** True only for the exact own-CT minimum; team scenarios are proposals. */
  readonly exact: boolean
}

export type ScenarioOutcome =
  | { readonly status: 'ok'; readonly scenario: EvaluatedScenario }
  | { readonly status: 'infeasible'; readonly reason: Infeasibility }

export interface ReverseEngineering {
  readonly target: number
  readonly current: CommissionResult
  /** The current data already reaches the target: no scenario is needed. */
  readonly alreadyReached: boolean
  readonly ownOnly: ScenarioOutcome
  readonly balanced: ScenarioOutcome
  readonly moreTeam: ScenarioOutcome
}

/** Upper bound of the searches, in points. */
const SEARCH_LIMIT = 10_000_000
/** Own-effort shares (of the own-only minimum) tried for the team scenarios. */
const OWN_SHARES = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9] as const

const ceilHundredth = (value: number) => Math.ceil(Math.round(value * 1e6) / 1e4) / 100
const roundHundredth = (value: number) => Math.round(value * 100) / 100

function evaluate(input: CommissionInput, market: Market, scenario: Scenario, options: CommissionOptions): CommissionResult {
  return computeCommission(applyScenario(input, scenario), market, options)
}

interface TeamSearch {
  readonly scenario: Scenario
  readonly strategy: AllocationStrategy
  readonly result: CommissionResult
}

/**
 * Smallest team total (to the hundredth) that, split with `strategy` and with `ownExtra` own
 * points, reaches `target`. Null if not reachable.
 */
export function minimalTeam(
  input: CommissionInput,
  market: Market,
  target: number,
  ownExtra: number,
  strategy: AllocationStrategy,
  options: CommissionOptions = {},
): TeamSearch | null {
  if (input.teamVolumes.length === 0) return null
  const scenarioFor = (hundredths: number): Scenario => ({ ownExtra, legExtras: allocate(strategy, input.teamVolumes, hundredths / 100) })
  const amountAt = (hundredths: number) => evaluate(input, market, scenarioFor(hundredths), options).amount
  let high = SEARCH_LIMIT * 100
  if (amountAt(high) < target) return null
  let low = -1 // «not enough» (−1: zero may already be enough)
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (amountAt(middle) >= target) high = middle
    else low = middle
  }
  // Rounding the split to hundredths can make the amount wiggle by a cent; verify and bump.
  while (amountAt(high) < target) high++
  const scenario = scenarioFor(high)
  return { scenario, strategy, result: evaluate(input, market, scenario, options) }
}

function infeasibility(input: CommissionInput, market: Market, ownExtra: number, options: CommissionOptions): Infeasibility {
  if (input.teamVolumes.length === 0) return 'noLegs'
  const huge = { ownExtra, legExtras: input.teamVolumes.map(() => SEARCH_LIMIT) }
  return evaluate(input, market, huge, options).level === null ? 'ownBelowLevel1' : 'unreachable'
}

function toEvaluated(kind: ScenarioKind, target: number, search: { scenario: Scenario; strategy: AllocationStrategy | null; result: CommissionResult }, exact: boolean): EvaluatedScenario {
  return {
    kind,
    scenario: search.scenario,
    strategy: search.strategy,
    ownExtra: roundHundredth(search.scenario.ownExtra),
    teamExtra: teamExtraOf(search.scenario),
    result: search.result,
    difference: roundHundredth(search.result.amount - target),
    exact,
  }
}

const STRATEGY_PREFERENCE: Record<AllocationStrategy, number> = { levelling: 0, proportional: 1, equal: 2 }

/** Best team scenario for a fixed own extra: the strategy needing the fewest team points. */
function bestTeamFor(input: CommissionInput, market: Market, target: number, ownExtra: number, options: CommissionOptions): TeamSearch | null {
  let best: TeamSearch | null = null
  for (const strategy of ALLOCATION_STRATEGIES) {
    const found = minimalTeam(input, market, target, ownExtra, strategy, options)
    if (!found) continue
    const total = teamExtraOf(found.scenario)
    const bestTotal = best ? teamExtraOf(best.scenario) : Infinity
    if (total < bestTotal || (total === bestTotal && best && STRATEGY_PREFERENCE[strategy] < STRATEGY_PREFERENCE[best.strategy])) best = found
  }
  return best
}

/**
 * Manual control: with `ownExtra` fixed by the partner, the fewest team points (best strategy)
 * that reach the target. Team points are 0 when own points alone suffice.
 */
export function scenarioForOwnExtra(
  input: CommissionInput,
  market: Market,
  target: number,
  ownExtra: number,
  options: CommissionOptions = {},
): ScenarioOutcome {
  const own = roundHundredth(Math.max(0, ownExtra))
  const ownOnly = evaluate(input, market, { ownExtra: own, legExtras: [] }, options)
  if (ownOnly.amount >= target) {
    return { status: 'ok', scenario: toEvaluated('manual', target, { scenario: { ownExtra: own, legExtras: input.teamVolumes.map(() => 0) }, strategy: null, result: ownOnly }, false) }
  }
  const best = bestTeamFor(input, market, target, own, options)
  return best ? { status: 'ok', scenario: toEvaluated('manual', target, best, false) } : { status: 'infeasible', reason: infeasibility(input, market, own, options) }
}

interface Candidate {
  readonly search: TeamSearch
  readonly own: number
  readonly team: number
}

/** Keeps candidates that no other candidate beats on both own and team points. */
export function nonDominated<T extends { own: number; team: number }>(candidates: readonly T[]): T[] {
  return candidates.filter(
    (candidate) =>
      !candidates.some(
        (other) => other.own <= candidate.own && other.team <= candidate.team && (other.own < candidate.own || other.team < candidate.team),
      ),
  )
}

const sameScenario = (a: Candidate, b: Candidate) =>
  a.own === b.own && a.search.scenario.legExtras.every((extra, index) => roundHundredth(extra) === roundHundredth(b.search.scenario.legExtras[index] ?? 0))

/**
 * The three scenarios for a target commission (D-021):
 * 1. «Solo yo»: exact minimum extra own CT, team unchanged.
 * 2. «Mi equipo y yo»: the most balanced non-dominated combination of own and team points.
 * 3. «Mayor aportación del equipo»: the non-dominated combination with the least own CT.
 */
export function reverseEngineer(input: CommissionInput, market: Market, target: number, options: CommissionOptions = {}): ReverseEngineering {
  const current = computeCommission(input, market, options)
  if (current.amount >= target) {
    const none: ScenarioOutcome = { status: 'infeasible', reason: 'unreachable' }
    return { target, current, alreadyReached: true, ownOnly: none, balanced: none, moreTeam: none }
  }

  const own = simulateTargetAmount(input, market, target, options)
  const ownOnly: ScenarioOutcome = own
    ? { status: 'ok', scenario: toEvaluated('ownOnly', target, { scenario: { ownExtra: own.extraOwn, legExtras: input.teamVolumes.map(() => 0) }, strategy: null, result: own.result }, true) }
    : { status: 'infeasible', reason: 'unreachable' }
  const ownMinimum = own?.extraOwn ?? 0

  const candidates: Candidate[] = []
  for (const share of OWN_SHARES) {
    const ownExtra = ceilHundredth(ownMinimum * share)
    for (const strategy of ALLOCATION_STRATEGIES) {
      const search = minimalTeam(input, market, target, ownExtra, strategy, options)
      if (search) candidates.push({ search, own: ownExtra, team: teamExtraOf(search.scenario) })
    }
  }
  const front = nonDominated(candidates.filter((candidate) => candidate.team > 0))
  // Prefer the levelling strategy among equal candidates (fewest points to raise TT-n).
  const ordered = [...front].sort((a, b) => a.own - b.own || a.team - b.team || STRATEGY_PREFERENCE[a.search.strategy] - STRATEGY_PREFERENCE[b.search.strategy])
  const unique = ordered.filter((candidate, index) => ordered.findIndex((other) => sameScenario(other, candidate)) === index)

  const reason = infeasibility(input, market, 0, options)
  const moreTeamPick = unique[0]
  const moreTeam: ScenarioOutcome = moreTeamPick
    ? { status: 'ok', scenario: toEvaluated('moreTeam', target, moreTeamPick.search, false) }
    : { status: 'infeasible', reason }

  const teamReference = Math.min(...unique.filter((candidate) => candidate.own === 0).map((candidate) => candidate.team), Infinity)
  const teamScale = Number.isFinite(teamReference) ? teamReference : Math.max(...unique.map((candidate) => candidate.team), 1)
  const balance = (candidate: Candidate) => Math.max(ownMinimum > 0 ? candidate.own / ownMinimum : 0, candidate.team / teamScale)
  const balancedPick = unique
    .filter((candidate) => candidate.own > 0 && candidate !== moreTeamPick)
    .sort((a, b) => balance(a) - balance(b) || a.own + a.team - (b.own + b.team))[0]
  const balanced: ScenarioOutcome = balancedPick
    ? { status: 'ok', scenario: toEvaluated('balanced', target, balancedPick.search, false) }
    : { status: 'infeasible', reason }

  return { target, current, alreadyReached: false, ownOnly, balanced, moreTeam }
}
