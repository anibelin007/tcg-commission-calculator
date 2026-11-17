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

/**
 * Reads a value kept by `useRememberableState` without subscribing: the copy of this tab, else
 * the one remembered on the device (only when the partner turned «remember» on).
 */
export function peekRememberableState<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  session: Storage | undefined = globalThis.sessionStorage,
  device: Storage | undefined = globalThis.localStorage,
): T | null {
  const fromSession = read(session, key, isValid)
  if (fromSession) return fromSession
  try {
    return device?.getItem(`${key}/remember`) === '1' ? read(device, key, isValid) : null
  } catch {
    return null
  }
}

/**
 * Like `useSessionState`, plus an opt-in «remember on this device» (D-023): when on, the form is
 * also kept in `localStorage` of this browser (no server) until the partner turns it off or
 * clears the form. The choice itself is remembered on the device.
 */
export function useRememberableState<T>(
  key: string,
  initial: () => T,
  isValid: (value: unknown) => value is T,
  isEmpty: (value: T) => boolean,
  session: Storage | undefined = globalThis.sessionStorage,
  device: Storage | undefined = globalThis.localStorage,
): { state: T; setState: (update: T | ((current: T) => T)) => void; reset: () => void; remember: boolean; setRemember: (on: boolean) => void } {
  const flagKey = `${key}/remember`
  const [remember, setRememberFlag] = useState(() => {
    try {
      return device?.getItem(flagKey) === '1'
    } catch {
      return false
    }
  })
  const [state, setState] = useState<T>(() => (remember ? read(device, key, isValid) : null) ?? read(session, key, isValid) ?? initial())

  useEffect(() => {
    const write = (storage: Storage | undefined, keep: boolean) => {
      try {
        if (!keep || isEmpty(state)) storage?.removeItem(key)
        else storage?.setItem(key, JSON.stringify(state))
      } catch {
        // Ignore: the state still lives in memory.
      }
    }
    write(session, true)
    write(device, remember)
  }, [session, device, key, state, isEmpty, remember])

  const setRemember = useCallback(
    (on: boolean) => {
      try {
        if (on) device?.setItem(flagKey, '1')
        else device?.removeItem(flagKey)
      } catch {
        // Ignore.
      }
      setRememberFlag(on)
    },
    [device, flagKey],
  )
  const reset = useCallback(() => setState(initial()), [initial])
  return { state, setState, reset, remember, setRemember }
}
