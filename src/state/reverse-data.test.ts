import { describe, expect, it } from 'vitest'
import type { PlanData } from './plan-data'
import { initialReverseData, legsFromPlan } from './reverse-data'

const plan: PlanData = {
  target: '5',
  ownForecast: '600',
  ownDone: '',
  legs: [
    { id: 'a', alias: 'Ana', volume: '1000', done: '200' },
    { id: 'b', alias: '', volume: '800', done: '', fictitious: true },
  ],
}

describe('legsFromPlan', () => {
  it('keeps only real partners unless fictitious ones are asked for', () => {
    expect(legsFromPlan(plan, false)).toEqual([{ id: 'a', alias: 'Ana', volume: '1000' }])
    expect(legsFromPlan(plan, true).map((leg) => leg.id)).toEqual(['a', 'b'])
  })

  it('prefills tab 3 with every leg of the plan and the own forecast', () => {
    const data = initialReverseData(plan)
    expect(data.willingOwn).toBe('600')
    expect(data.legs).toHaveLength(2)
  })
})
