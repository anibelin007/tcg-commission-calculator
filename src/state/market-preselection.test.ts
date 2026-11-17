import { describe, expect, it } from 'vitest'
import { preselectMarketId } from './market-preselection'

describe('preselectMarketId (D-016)', () => {
  it('uses the region of the browser language', () => {
    expect(preselectMarketId(['de-AT', 'de'], 'de-AT')).toBe('AT')
    expect(preselectMarketId(['pl-PL'], 'en-GB')).toBe('PL')
  })

  it('skips browser regions that are not markets', () => {
    expect(preselectMarketId(['en-AU', 'es-MX'], 'en-GB')).toBe('MX')
  })

  it('falls back to the region of the UI locale', () => {
    expect(preselectMarketId(['ca'], 'ca-ES')).toBe('ES')
    expect(preselectMarketId(['en'], 'en-US')).toBe('US')
  })

  it('preselects the first contract type in France', () => {
    expect(preselectMarketId(['fr-FR'], 'en-GB')).toBe('FR-vdi')
  })

  it('falls back to Spain', () => {
    expect(preselectMarketId([], 'xx')).toBe('ES')
  })
})
