import { describe, expect, it } from 'vitest'
import { initialPartnerData } from './partner-data'
import { STORAGE_KEY, clearPartnerData, loadPartnerData, savePartnerData } from './session-storage'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

const sample = {
  ...initialPartnerData('ES'),
  customerTurnover: '600',
  ve1: '1200',
}

describe('session storage of the real data (D-007)', () => {
  it('saves and loads the data under one versioned key', () => {
    const storage = memoryStorage()
    savePartnerData(storage, sample)
    expect([...storage.data.keys()]).toEqual([STORAGE_KEY])
    expect(loadPartnerData(storage)).toEqual(sample)
  })

  it('clears the data', () => {
    const storage = memoryStorage()
    savePartnerData(storage, sample)
    clearPartnerData(storage)
    expect(loadPartnerData(storage)).toBeNull()
  })

  it('ignores missing, corrupt or unexpected data', () => {
    const storage = memoryStorage()
    expect(loadPartnerData(storage)).toBeNull()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadPartnerData(storage)).toBeNull()
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...sample, ve1: 1200 }))
    expect(loadPartnerData(storage)).toBeNull()
  })

  it('survives missing or failing storage', () => {
    expect(loadPartnerData(undefined)).toBeNull()
    const failing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadPartnerData(failing)).toBeNull()
    expect(() => savePartnerData(failing, sample)).not.toThrow()
    expect(() => clearPartnerData(failing)).not.toThrow()
  })
})
