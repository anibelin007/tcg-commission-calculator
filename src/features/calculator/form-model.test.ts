import { describe, expect, it } from 'vitest'
import { MAX_GENERATION_FIELDS, addGeneration, initialFormState, parseForm, parsePoints } from './form-model'

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
  it('converts the Online Office figures into engine input', () => {
    const state = {
      ...initialFormState('ES'),
      customerTurnover: '1000',
      generations: ['1600', '1900', '', '', ''],
      partners: [
        { key: 1, volume: '1700' },
        { key: 2, volume: '1800' },
      ],
      breakdown: ['900', '900', '', '', ''],
    }
    expect(parseForm(state)).toEqual({
      input: {
        customerTurnover: 1000,
        personalTurnover: 0,
        generationVolumes: [1600, 1900, 0, 0, 0],
        teamVolumes: [1700, 1800],
        strongestTeamGenerations: [900, 900, 0, 0, 0],
      },
      invalid: [],
    })
  })

  it('treats an untouched breakdown as not given', () => {
    expect(parseForm(initialFormState('ES')).input.strongestTeamGenerations).toBeUndefined()
  })

  it('reports invalid fields and counts them as 0', () => {
    const state = {
      ...initialFormState('ES'),
      customerTurnover: '-5',
      generations: ['x', '', '', '', ''],
      partners: [{ key: 1, volume: '-1' }],
    }
    const parsed = parseForm(state)
    expect(parsed.invalid).toEqual(['customerTurnover', 'generation-0', 'partner-0'])
    expect(parsed.input.customerTurnover).toBe(0)
  })

  it('starts with five generations, as the Online Office table, and grows to ten', () => {
    let state = initialFormState('ES')
    expect(state.generations).toHaveLength(5)
    for (let i = 0; i < 10; i++) state = addGeneration(state)
    expect(state.generations).toHaveLength(MAX_GENERATION_FIELDS)
    expect(state.breakdown).toHaveLength(MAX_GENERATION_FIELDS)
  })
})
