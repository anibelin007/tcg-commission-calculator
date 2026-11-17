import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { computeCommission, findMarket } from '../domain/commission'
import { FALLBACK_MARKET_ID } from './market-preselection'
import { initialPartnerData, isEmptyPartnerData, parsePartnerData, type PartnerData } from './partner-data'
import { PartnerDataContext, type PartnerDataContextValue } from './partner-data-context'
import { clearPartnerData, loadPartnerData, savePartnerData } from './session-storage'

interface PartnerDataProviderProps {
  /** Preselected market for a new session (D-016). */
  initialMarketId: string
  /** `sessionStorage` of the tab; injectable for tests. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  children: ReactNode
}

/**
 * Single source of truth for the real data shared by the three tabs (D-019). Restores the
 * data of this tab from `sessionStorage` and saves every change there (D-007).
 */
export function PartnerDataProvider({ initialMarketId, storage, children }: PartnerDataProviderProps) {
  const [data, setData] = useState<PartnerData>(() => loadPartnerData(storage) ?? initialPartnerData(initialMarketId))
  const legCounter = useRef(0)

  // Nothing entered (no points, no legs) → nothing kept: «Borrar mis datos» leaves no trace.
  useEffect(() => {
    if (isEmptyPartnerData(data) && data.legs.length === 0) clearPartnerData(storage)
    else savePartnerData(storage, data)
  }, [storage, data])

  const update = useCallback<PartnerDataContextValue['update']>(
    (patch) => setData((current) => (typeof patch === 'function' ? patch(current) : { ...current, ...patch })),
    [],
  )
  const clear = useCallback(() => {
    clearPartnerData(storage)
    setData((current) => initialPartnerData(current.marketId))
  }, [storage])
  const newLegId = useCallback(() => `leg-${Date.now().toString(36)}-${(legCounter.current++).toString(36)}`, [])

  const value = useMemo<PartnerDataContextValue>(() => {
    const market = findMarket(data.marketId) ?? findMarket(FALLBACK_MARKET_ID)!
    const parsed = parsePartnerData(data)
    return { data, update, clear, newLegId, parsed, market, result: computeCommission(parsed.input, market) }
  }, [data, update, clear, newLegId])

  return <PartnerDataContext.Provider value={value}>{children}</PartnerDataContext.Provider>
}
