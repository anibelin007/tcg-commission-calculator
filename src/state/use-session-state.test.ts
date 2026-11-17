import { describe, expect, it } from 'vitest'
import { peekRememberableState, peekSessionState } from './use-session-state'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

const isNumberList = (value: unknown): value is number[] => Array.isArray(value) && value.every((item) => typeof item === 'number')

describe('peekSessionState', () => {
  it('reads valid stored data and ignores corrupt or unexpected data', () => {
    const storage = memoryStorage()
    expect(peekSessionState('k', isNumberList, storage)).toBeNull()
    storage.setItem('k', '[1,2]')
    expect(peekSessionState('k', isNumberList, storage)).toEqual([1, 2])
    storage.setItem('k', '{oops')
    expect(peekSessionState('k', isNumberList, storage)).toBeNull()
    storage.setItem('k', '["a"]')
    expect(peekSessionState('k', isNumberList, storage)).toBeNull()
  })
})

describe('peekRememberableState', () => {
  const isNumber = (value: unknown): value is number => typeof value === 'number'
  const storage = (entries: Record<string, string>): Storage => {
    const map = new Map(Object.entries(entries))
    return {
      get length() {
        return map.size
      },
      clear: () => map.clear(),
      getItem: (key) => map.get(key) ?? null,
      key: (index) => [...map.keys()][index] ?? null,
      removeItem: (key) => void map.delete(key),
      setItem: (key, value) => void map.set(key, value),
    }
  }

  it('prefers the copy of this tab', () => {
    expect(peekRememberableState('k', isNumber, storage({ k: '1' }), storage({ k: '2', 'k/remember': '1' }))).toBe(1)
  })

  it('falls back to the device copy only when remembered', () => {
    expect(peekRememberableState('k', isNumber, storage({}), storage({ k: '2', 'k/remember': '1' }))).toBe(2)
    expect(peekRememberableState('k', isNumber, storage({}), storage({ k: '2' }))).toBeNull()
  })
})
