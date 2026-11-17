import { useTranslation } from 'react-i18next'
import { simulateNextLevel } from '../../domain/commission'
import { formatAmount } from '../../shared/format'
import { isEmptyPartnerData } from '../../state/partner-data'
import { usePartnerData } from '../../state/partner-data-context'
import { EmptyDataNotice } from '../EmptyDataNotice'
import { CommissionChart } from './CommissionChart'
import { NextLevelPanel } from './NextLevelPanel'

/** Tab 2 «Mi siguiente meta»: what is missing for the next level and the step chart (D-019). */
export function NextLevelPage() {
  const { t, i18n } = useTranslation('calculator')
  const { data, parsed, market, result } = usePartnerData()
  if (isEmptyPartnerData(data)) return <EmptyDataNotice />
  const next = simulateNextLevel(parsed.input, market)
  return (
    <div className="flex flex-col gap-6">
      <p>{t('simulation.intro')}</p>
      <p className="rounded bg-tcg-surface px-4 py-3 font-semibold text-tcg-heading">
        {result.level === null
          ? t('simulation.next.currentNoLevel')
          : t('simulation.next.current', { level: result.level, amount: formatAmount(i18n.language, result.amount, market.currency) })}
      </p>
      <NextLevelPanel input={parsed.input} market={market} current={result} />
      <CommissionChart input={parsed.input} market={market} current={result} nextExtraOwn={next?.extraOwn ?? null} />
    </div>
  )
}
