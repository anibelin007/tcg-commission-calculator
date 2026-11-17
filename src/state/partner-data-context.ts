import { createContext, useContext } from 'react'
import type { CommissionResult, Market } from '../domain/commission'
import type { ParsedPartnerData, PartnerData } from './partner-data'

export interface PartnerDataContextValue {
  readonly data: PartnerData
  readonly update: (patch: Partial<PartnerData> | ((data: PartnerData) => PartnerData)) => void
  /** Deletes the data from this tab and starts again (keeps the market). */
  readonly clear: () => void
  readonly newLegId: () => string
  readonly parsed: ParsedPartnerData
  readonly market: Market
  /** Current commission from the real data (no simulation). */
  readonly result: CommissionResult
}

export const PartnerDataContext = createContext<PartnerDataContextValue | null>(null)

export function usePartnerData(): PartnerDataContextValue {
  const value = useContext(PartnerDataContext)
  if (!value) throw new Error('usePartnerData must be used inside PartnerDataProvider')
  return value
}
