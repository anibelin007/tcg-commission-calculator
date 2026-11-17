import { describe, expect, it } from 'vitest'
import { allocate } from './allocation'

const sum = (values: readonly number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100

describe('allocate (D-021)', () => {
  it('levelling raises the weakest legs first, without overtaking', () => {
    expect(allocate('levelling', [1000, 600, 600], 500)).toEqual([0, 250, 250])
    expect(allocate('levelling', [1000, 600], 400)).toEqual([0, 400])
  })

  it('levelling spreads equally once all legs are level', () => {
    expect(allocate('levelling', [1000, 600], 1069.28)).toEqual([334.64, 734.64])
  })

  it('proportional follows the current VE; equal gives the same to each', () => {
    expect(allocate('proportional', [1000, 600], 800)).toEqual([500, 300])
    expect(allocate('equal', [1000, 600], 800)).toEqual([400, 400])
  })

  it('splits legs with equal VE evenly', () => {
    for (const strategy of ['levelling', 'proportional', 'equal'] as const) {
      expect(allocate(strategy, [800, 800], 100)).toEqual([50, 50])
    }
  })

  it('always adds up exactly to the total, in hundredths', () => {
    for (const strategy of ['levelling', 'proportional', 'equal'] as const) {
      for (const total of [0, 0.01, 1, 33.33, 1000.07]) {
        expect(sum(allocate(strategy, [1, 2, 4], total))).toBe(total)
      }
    }
    expect(allocate('equal', [5, 5, 5], 0.01)).toEqual([0.01, 0, 0])
  })

  it('handles no legs and legs without volume', () => {
    expect(allocate('levelling', [], 100)).toEqual([])
    expect(allocate('proportional', [0, 0], 10)).toEqual([5, 5])
  })

  it('never gives a leg less when the total grows (monotone, needed by the binary search)', () => {
    for (const strategy of ['levelling', 'proportional', 'equal'] as const) {
      let previous = allocate(strategy, [700, 300, 50], 0)
      for (let total = 0.5; total <= 2000; total += 37.5) {
        const next = allocate(strategy, [700, 300, 50], total)
        next.forEach((value, index) => expect(value).toBeGreaterThanOrEqual(previous[index]! - 0.01))
        previous = next
      }
    }
  })
})
