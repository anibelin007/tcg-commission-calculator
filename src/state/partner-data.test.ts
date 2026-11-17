import { describe, expect, it } from 'vitest'
import {
  MAX_GENERATION_FIELDS,
  addGeneration,
  initialPartnerData,
  isEmptyPartnerData,
  parsePartnerData,
  parsePoints,
} from './partner-data'

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

describe('parsePartnerData', () => {
  it('converts the Online Office figures into engine input, with the reported VE-1/2/3', () => {
    const data = {
      ...initialPartnerData('ES'),
      customerTurnover: '1000',
      generations: ['1600', '1900', '', '', ''],
      ve1: '2700',
      ve2: '1000',
      ve3: '',
    }
    expect(parsePartnerData(data)).toEqual({
      input: {
        customerTurnover: 1000,
        personalTurnover: 0,
        generationVolumes: [1600, 1900, 0, 0, 0],
        teamVolumes: [],
        reportedTeamMinus: { tt1: 2700, tt2: 1000, tt3: undefined },
      },
      invalid: [],
    })
  })

  it('reports invalid fields and counts them as 0', () => {
    const data = {
      ...initialPartnerData('ES'),
      customerTurnover: '-5',
      generations: ['x', '', '', '', ''],
      ve1: '-1',
    }
    const parsed = parsePartnerData(data)
    expect(parsed.invalid).toEqual(['customerTurnover', 'generation-0', 've1'])
    expect(parsed.input.customerTurnover).toBe(0)
  })

  it('starts with five generations, as the Online Office table, and grows to ten', () => {
    let data = initialPartnerData('ES')
    expect(data.generations).toHaveLength(5)
    for (let i = 0; i < 10; i++) data = addGeneration(data)
    expect(data.generations).toHaveLength(MAX_GENERATION_FIELDS)
  })

  it('knows when nothing has been entered yet', () => {
    expect(isEmptyPartnerData(initialPartnerData('ES'))).toBe(true)
    expect(isEmptyPartnerData({ ...initialPartnerData('ES'), ve1: '10' })).toBe(false)
    expect(isEmptyPartnerData({ ...initialPartnerData('ES'), customerTurnover: '10' })).toBe(false)
  })
})
