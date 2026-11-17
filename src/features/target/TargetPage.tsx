import { useTranslation } from 'react-i18next'
import { isEmptyPartnerData } from '../../state/partner-data'
import { usePartnerData } from '../../state/partner-data-context'
import { EmptyDataNotice } from '../EmptyDataNotice'
import { TargetAmountPanel } from './TargetAmountPanel'

/** Tab 3 «Ingeniería inversa»: from a target amount to the points needed (D-019). */
export function TargetPage() {
  const { t } = useTranslation('calculator')
  const { data, parsed, market, result } = usePartnerData()
  if (isEmptyPartnerData(data)) return <EmptyDataNotice />
  return (
    <div className="flex flex-col gap-6">
      <p>{t('simulation.intro')}</p>
      <TargetAmountPanel input={parsed.input} market={market} current={result} />
    </div>
  )
}
