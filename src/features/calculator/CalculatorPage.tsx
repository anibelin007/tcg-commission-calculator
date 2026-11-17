import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { computeCommission, findMarket } from '../../domain/commission'
import { addGeneration, initialFormState, parseForm, type FormState } from './form-model'
import { formatPoints } from './format'
import { GenerationFields } from './GenerationFields'
import { FALLBACK_MARKET_ID } from './market-preselection'
import { MarketFields } from './MarketFields'
import { NumberField } from './NumberField'
import { PartnerFields } from './PartnerFields'
import { ResultPanel } from './ResultPanel'
import { SimulationPanel } from './SimulationPanel'

interface CalculatorPageProps {
  /** Preselected market (D-016). */
  initialMarketId: string
}

const legendClass = 'mb-2 text-xl font-semibold text-tcg-heading'

/**
 * Manual calculator, laid out like the Online Office: points per generation (commission) and
 * the VE of each direct partner (target level). The result updates on every change. Nothing
 * is stored or sent (D-007).
 */
export function CalculatorPage({ initialMarketId }: CalculatorPageProps) {
  const { t, i18n } = useTranslation('calculator')
  const [state, setState] = useState<FormState>(() => initialFormState(initialMarketId))
  const nextPartnerKey = useRef(1)
  const market = findMarket(state.marketId) ?? findMarket(FALLBACK_MARKET_ID)!
  const parsed = useMemo(() => parseForm(state), [state])
  const result = useMemo(() => computeCommission(parsed.input, market), [parsed, market])
  const update = (patch: Partial<FormState>) => setState((current) => ({ ...current, ...patch }))
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
            value={state.customerTurnover}
            onChange={(customerTurnover) => update({ customerTurnover })}
            error={parsed.invalid.includes('customerTurnover') ? t('invalid') : undefined}
          />
          {isUsa && (
            <NumberField
              label={t('own.personalTurnover')}
              help={t('own.personalTurnoverHelp')}
              value={state.personalTurnover}
              onChange={(personalTurnover) => update({ personalTurnover })}
              error={parsed.invalid.includes('personalTurnover') ? t('invalid') : undefined}
            />
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className={legendClass}>{t('generations.legend')}</legend>
          <p className="text-sm">{t('generations.help')}</p>
          <GenerationFields
            values={state.generations}
            fieldPrefix="generation"
            invalid={parsed.invalid}
            onChange={(generations) => update({ generations })}
            onAdd={() => setState(addGeneration)}
          />
        </fieldset>

        <PartnerFields
          partners={state.partners}
          invalid={parsed.invalid}
          onChange={(partners) => update({ partners })}
          onAdd={() => update({ partners: [...state.partners, { key: nextPartnerKey.current++, volume: '' }] })}
        />

        {strongest && result.level !== null && (
          <fieldset className="flex flex-col gap-4 rounded border border-tcg-accent bg-white p-4">
            <legend className={`${legendClass} px-1`}>{t('breakdown.legend')}</legend>
            <p className="text-sm">
              {t('breakdown.help', {
                number: strongest.index + 1,
                volume: formatPoints(i18n.language, strongest.volume),
                level: result.level,
                limit: formatPoints(i18n.language, strongest.limit),
              })}
            </p>
            <GenerationFields
              values={state.breakdown}
              fieldPrefix="breakdown"
              invalid={parsed.invalid}
              onChange={(breakdown) => update({ breakdown })}
            />
          </fieldset>
        )}
      </form>
      <ResultPanel result={result} market={market} />
      <SimulationPanel input={parsed.input} market={market} current={result} />
    </div>
  )
}
