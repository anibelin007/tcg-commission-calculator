import type { LegDraft, PartnerData } from './partner-data'

/**
 * Keeps the real data only in `sessionStorage` of the current tab (D-007 as amended
 * 2026-11-17): it survives reloads and back/forward navigation, is deleted when the tab
 * closes or with «Borrar mis datos», and never leaves the browser. Scenarios are not stored.
 */
export const STORAGE_KEY = 'tcg-commission-calculator/partner-data/v1'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>

const isString = (value: unknown): value is string => typeof value === 'string'
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)

function isLeg(value: unknown): value is LegDraft {
  if (typeof value !== 'object' || value === null) return false
  const leg = value as Record<string, unknown>
  return isString(leg.id) && isString(leg.alias) && isString(leg.volume)
}

/** Shape check of stored data; anything unexpected is ignored rather than trusted. */
export function isPartnerData(value: unknown): value is PartnerData {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return (
    isString(data.marketId) &&
    isString(data.customerTurnover) &&
    isString(data.personalTurnover) &&
    isStringArray(data.generations) &&
    isStringArray(data.breakdown) &&
    Array.isArray(data.legs) &&
    data.legs.every(isLeg)
  )
}

export function loadPartnerData(storage: Storage | undefined): PartnerData | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isPartnerData(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function savePartnerData(storage: Storage | undefined, data: PartnerData): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore (e.g. storage disabled): the data still lives in memory while the page is open.
  }
}

export function clearPartnerData(storage: Storage | undefined): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
