import { describe, expect, it } from 'vitest'
import { BUSINESS_CONVERSATIONS_PER_PARTNER, businessConversationsFor, latestJoiningMonth } from './prospecting'

describe('latestJoiningMonth (BR-23)', () => {
  it('is the month before the planned month', () => {
    expect(latestJoiningMonth({ year: 2026, month: 12 })).toEqual({ year: 2026, month: 11 })
    expect(latestJoiningMonth({ year: 2027, month: 1 })).toEqual({ year: 2026, month: 12 })
  })
})

describe('businessConversationsFor (D-024, team statistic)', () => {
  it.each([
    [0, 0],
    [1, 10],
    [2, 20],
    [-1, 0],
  ])('%d new partners → %d CN', (partners, expected) => {
    expect(businessConversationsFor(partners)).toBe(expected)
  })

  it('uses 10 CN per new partner', () => {
    expect(BUSINESS_CONVERSATIONS_PER_PARTNER).toBe(10)
  })
})
