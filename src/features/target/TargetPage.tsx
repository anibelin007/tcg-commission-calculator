import { useLegName } from '../../components/leg-name'
import { isEmptyPartnerData } from '../../state/partner-data'
import { usePartnerData } from '../../state/partner-data-context'
import { EmptyDataNotice } from '../EmptyDataNotice'
import { ReverseEngineeringPanel } from './ReverseEngineeringPanel'

/**
 * Tab 3 «Ingeniería inversa»: from a target commission to the points needed (D-019, D-021).
 * Works without real data too, starting from zero.
 */
export function TargetPage() {
  const { data, parsed, market, result } = usePartnerData()
  const legName = useLegName()
  const legNames = data.legs.map((_, index) => legName(data.legs, index))
  return (
    <div className="flex flex-col gap-6">
      {isEmptyPartnerData(data) && <EmptyDataNotice />}
      <ReverseEngineeringPanel input={parsed.input} market={market} current={result} legNames={legNames} />
    </div>
  )
}
