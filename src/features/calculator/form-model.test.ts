import { describe, expect, it } from 'vitest'
import { initialFormState, newTeam, parseForm, parsePoints } from './form-model'

describe('parsePoints', () => {
  it.each([
    ['', 0],
    ['  ', 0],
    ['825', 825],
    ['30.3', 30.3],
    ['0', 0],
  ])('%j → %s', (raw, expected) => {
    expect(parsePoints(raw)).toBe(expected)
  })

  it.each(['-1', 'abc', 'Infinity'])('rejects %j', (raw) => {
    expect(parsePoints(raw)).toBeNull()
  })
})

describe('parseForm', () => {
  it('converts teams and generations into engine input', () => {
    const state = {
      ...initialFormState('ES'),
      customerTurnover: '1000',
      teams: [
        { key: 1, generations: ['700', '1000', ''] },
        { key: 2, generations: ['900', '900', ''] },
      ],
    }
    expect(parseForm(state)).toEqual({
      input: {
        customerTurnover: 1000,
        personalTurnover: 0,
        teams: [{ generations: [700, 1000, 0] }, { generations: [900, 900, 0] }],
      },
      invalid: [],
    })
  })

  it('reports invalid fields and counts them as 0', () => {
    const state = { ...initialFormState('ES'), customerTurnover: '-5', teams: [{ key: 1, generations: ['x'] }] }
    const parsed = parseForm(state)
    expect(parsed.invalid).toEqual(['customerTurnover', 'team-0-generation-0'])
    expect(parsed.input.customerTurnover).toBe(0)
  })

  it('starts new teams with three empty generations', () => {
    expect(newTeam(7)).toEqual({ key: 7, generations: ['', '', ''] })
  })
})
