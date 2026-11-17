import { computeCommission, type CommissionInput, type CommissionResult, type Market } from '../commission'

export interface PartnersNeeded {
  /** Additional active direct partners (legs) of `average` points each. */
  readonly count: number
  readonly result: CommissionResult
}

/**
 * Smallest number of additional legs, each making `average` points (in generation 1), that
 * reaches `target`, up to `max`. Null if `average` is not positive or `max` legs are not enough.
 * New partners only count from the month after they join (BR-23): the UI says so.
 */
export function partnersNeeded(input: CommissionInput, market: Market, target: number, average: number, max = 50): PartnersNeeded | null {
  if (!(average > 0)) return null
  const [generation1 = 0, ...deeper] = input.generationVolumes
  for (let count = 1; count <= max; count++) {
    const withPartners: CommissionInput = {
      ...input,
      generationVolumes: [generation1 + count * average, ...deeper],
      teamVolumes: [...input.teamVolumes, ...Array.from({ length: count }, () => average)],
    }
    const result = computeCommission(withPartners, market)
    if (result.amount >= target) return { count, result }
  }
  return null
}
