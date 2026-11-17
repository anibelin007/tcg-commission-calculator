import { describe, expect, it } from 'vitest'
import { niceTicks } from './chart-scale'

describe('niceTicks', () => {
  it.each([
    [1000, [0, 250, 500, 750, 1000]],
    [1237.5, [0, 500, 1000, 1500]],
    [514.8, [0, 200, 400, 600]],
    [0, [0]],
  ])('%s → %j', (max, ticks) => {
    expect(niceTicks(max)).toEqual(ticks)
  })
})
