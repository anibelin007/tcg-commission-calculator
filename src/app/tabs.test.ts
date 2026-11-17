import { describe, expect, it } from 'vitest'
import { DEFAULT_TAB, hashFor, tabFromHash } from './tabs'

describe('tabs (D-019)', () => {
  it.each([
    ['', 'commission'],
    ['#commission', 'commission'],
    ['#plan', 'plan'],
    ['#/target', 'target'],
    ['#unknown', DEFAULT_TAB],
  ])('%j → %s', (hash, tab) => {
    expect(tabFromHash(hash)).toBe(tab)
  })

  it('round-trips', () => {
    expect(tabFromHash(hashFor('target'))).toBe('target')
  })
})
