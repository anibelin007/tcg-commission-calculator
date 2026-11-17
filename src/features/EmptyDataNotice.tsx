import { useTranslation } from 'react-i18next'
import { hashFor } from '../app/tabs'

/**
 * Shown above the simulation tabs while no real data has been entered: they still work and
 * start from zero (planning ahead), with a link to enter the real data in tab 1.
 */
export function EmptyDataNotice() {
  const { t } = useTranslation('calculator')
  return (
    <div className="flex flex-col gap-2 rounded border border-tcg-accent bg-white p-4 text-sm">
      <p>{t('emptyState.text')}</p>
      <a href={hashFor('commission')} className="self-start font-semibold text-tcg-primary underline">
        {t('emptyState.action')}
      </a>
    </div>
  )
}
