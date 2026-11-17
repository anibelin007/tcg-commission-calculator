import { useTranslation } from 'react-i18next'
import { GenerationFields } from '../../components/GenerationFields'
import { MarketFields } from '../../components/MarketFields'
import { NumberField } from '../../components/NumberField'
import { addGeneration } from '../../state/partner-data'
import { usePartnerData } from '../../state/partner-data-context'
import { ResultPanel } from './ResultPanel'

const legendClass = 'mb-2 text-xl font-semibold text-tcg-heading'

/**
 * Tab 1 «Mi comisión actual»: the reality, as in the Online Office (design §7): CT, points per
 * generation (commission) and the partner's own VE-1, VE-2 and VE-3 (level). No legs and no
 * simulations here.
 */
export function CurrentCommissionPage() {
  const { t } = useTranslation('calculator')
  const { data, update, clear, parsed, market, result } = usePartnerData()
  const isUsa = market.plan === 'usa'
  const measure = (key: 'tt1' | 'tt2' | 'tt3') => t(`simulation.measures.${key}`)

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
            invalid={parsed.invalid}
            onChange={(generations) => update({ generations })}
            onAdd={() => update(addGeneration)}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className={legendClass}>{t('teamMinus.legend')}</legend>
          <p className="text-sm">{t('teamMinus.help')}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['ve1', 've2', 've3'] as const).map((field, index) => (
              <NumberField
                key={field}
                label={measure((['tt1', 'tt2', 'tt3'] as const)[index]!)}
                value={data[field]}
                onChange={(value) => update({ [field]: value })}
                error={parsed.invalid.includes(field) ? t('invalid') : undefined}
              />
            ))}
          </div>
        </fieldset>
      </form>

      <ResultPanel result={result} market={market} legNames={[]} />

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <p>{t('data.note')}</p>
        <button type="button" onClick={clear} className="font-semibold text-tcg-primary underline">
          {t('data.clear')}
        </button>
      </div>
    </div>
  )
}
