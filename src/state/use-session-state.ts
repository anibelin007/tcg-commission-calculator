import { useCallback, useEffect, useState } from 'react'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>

function read<T>(storage: Storage | undefined, key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    return isValid(value) ? value : null
  } catch {
    return null
  }
}

/**
 * Form state kept in `sessionStorage` of the browser tab (D-007): it survives reloads and
 * back/forward navigation and is deleted when the tab closes or with `reset`. Stored data is
 * shape-checked; nothing is kept while the form is empty.
 */
export function useSessionState<T>(
  key: string,
  initial: () => T,
  isValid: (value: unknown) => value is T,
  isEmpty: (value: T) => boolean,
  storage: Storage | undefined = globalThis.sessionStorage,
): [T, (update: T | ((current: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => read(storage, key, isValid) ?? initial())

  useEffect(() => {
    try {
      if (isEmpty(state)) storage?.removeItem(key)
      else storage?.setItem(key, JSON.stringify(state))
    } catch {
      // Ignore (e.g. storage disabled): the state still lives in memory.
    }
  }, [storage, key, state, isEmpty])

  const reset = useCallback(() => setState(initial()), [initial])
  return [state, setState, reset]
}

/** Reads a stored form without subscribing to it (e.g. to prefill another tab). */
export function peekSessionState<T>(key: string, isValid: (value: unknown) => value is T, storage: Storage | undefined = globalThis.sessionStorage): T | null {
  return read(storage, key, isValid)
}
