import { useTranslation } from 'react-i18next'
import type { LegDraft } from '../state/partner-data'

/** Display name of a leg: its alias, or «Pata N» by position. */
export function useLegName() {
  const { t } = useTranslation('calculator')
  return (legs: readonly LegDraft[], index: number) => legs[index]?.alias.trim() || t('legs.defaultName', { number: index + 1 })
}
