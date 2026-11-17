import { useTranslation } from 'react-i18next'
import { hashFor } from '../app/tabs'

/** Shown in the simulation tabs until the real data has been entered in tab 1. */
export function EmptyDataNotice() {
  const { t } = useTranslation('calculator')
  return (
    <div className="flex flex-col gap-2 rounded border border-tcg-surface-strong bg-white p-4">
      <p>{t('emptyState.text')}</p>
      <a href={hashFor('commission')} className="self-start font-semibold text-tcg-primary underline">
        {t('emptyState.action')}
      </a>
    </div>
  )
}
