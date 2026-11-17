import { useTranslation } from 'react-i18next'
import { GenerationFields } from '../../components/GenerationFields'
import { LegFields } from '../../components/LegFields'
import { useLegName } from '../../components/leg-name'
import { MarketFields } from '../../components/MarketFields'
import { NumberField } from '../../components/NumberField'
import { formatPoints } from '../../shared/format'
import { addGeneration, newLeg } from '../../state/partner-data'
import { usePartnerData } from '../../state/partner-data-context'
import { ResultPanel } from './ResultPanel'

const legendClass = 'mb-2 text-xl font-semibold text-tcg-heading'

/**
 * Tab 1 «Mi comisión actual»: the real data, laid out like the Online Office, and the
 * estimated commission. No hypothetical simulations here (D-019).
 */
export function CurrentCommissionPage() {
  const { t, i18n } = useTranslation('calculator')
  const { data, update, clear, newLegId, parsed, market, result } = usePartnerData()
  const legName = useLegName()
  const legNames = data.legs.map((_, index) => legName(data.legs, index))
  const isUsa = market.plan === 'usa'
  const strongest = result.strongestTeam

  return (
    <div className="flex flex-col gap-8">
      <p>{t('intro')}</p>
      <form className="flex flex-col gap-8" onSubmit={(event) => event.preventDefault()}>
        <MarketFields marketId={market.id} onChange={(marketId) => update({ marketId })} />

        <fieldset className="flex flex-col gap-4">
          <legend className={legendClass}>{t('own.legend')}</legend>
          <NumberField
            label={t('own.customerTurnover')}
            help={t(isUsa ? 'own.customerTurnoverHelpUsa' : 'own.customerTurnoverHelp')}
            value={data.customerTurnover}
            onChange={(customerTurnover) => update({ customerTurnover })}
            error={parsed.invalid.includes('customerTurnover') ? t('invalid') : undefined}
          />
          {isUsa && (
            <NumberField
              label={t('own.personalTurnover')}
              help={t('own.personalTurnoverHelp')}
              value={data.personalTurnover}
              onChange={(personalTurnover) => update({ personalTurnover })}
              error={parsed.invalid.includes('personalTurnover') ? t('invalid') : undefined}
            />
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className={legendClass}>{t('generations.legend')}</legend>
          <p className="text-sm">{t('generations.help')}</p>
          <GenerationFields
            values={data.generations}
            fieldPrefix="generation"
            invalid={parsed.invalid}
            onChange={(generations) => update({ generations })}
            onAdd={() => update(addGeneration)}
          />
        </fieldset>

        <LegFields
          legs={data.legs}
          invalid={parsed.invalid}
          onChange={(legs) => update({ legs })}
          onAdd={() => update((current) => ({ ...current, legs: [...current.legs, newLeg(newLegId())] }))}
        />

        {strongest?.status === 'breakdownMissing' && result.level !== null && (
          <fieldset className="flex flex-col gap-4 rounded border border-tcg-accent bg-white p-4">
            <legend className={`${legendClass} px-1`}>{t('breakdown.legend')}</legend>
            <p className="text-sm">
              {t('breakdown.help', {
                team: legNames[strongest.index],
                volume: formatPoints(i18n.language, strongest.volume),
                level: result.level,
                limit: formatPoints(i18n.language, strongest.limit),
              })}
            </p>
            <GenerationFields values={data.breakdown} fieldPrefix="breakdown" invalid={parsed.invalid} onChange={(breakdown) => update({ breakdown })} />
          </fieldset>
        )}
      </form>

      <ResultPanel result={result} market={market} legNames={legNames} />

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <p>{t('data.note')}</p>
        <button type="button" onClick={clear} className="font-semibold text-tcg-primary underline">
          {t('data.clear')}
        </button>
      </div>
    </div>
  )
}
