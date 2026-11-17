import { describe, expect, it } from 'vitest'
import { peekSessionState } from './use-session-state'

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
