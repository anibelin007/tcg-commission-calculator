import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { computeCommission, findMarket } from '../../domain/commission'
import { initialFormState, newTeam, parseForm, type FormState } from './form-model'
import { FALLBACK_MARKET_ID } from './market-preselection'
import { MarketFields } from './MarketFields'
import { NumberField } from './NumberField'
import { ResultPanel } from './ResultPanel'
import { TeamsEditor } from './TeamsEditor'

interface CalculatorPageProps {
  /** Preselected market (D-016). */
  initialMarketId: string
}

/** Manual calculator: the result updates on every change. Nothing is stored or sent (D-007). */
export function CalculatorPage({ initialMarketId }: CalculatorPageProps) {
  const { t } = useTranslation('calculator')
  const [state, setState] = useState<FormState>(() => initialFormState(initialMarketId))
  const nextTeamKey = useRef(1)
  const market = findMarket(state.marketId) ?? findMarket(FALLBACK_MARKET_ID)!
  const parsed = useMemo(() => parseForm(state), [state])
  const result = useMemo(() => computeCommission(parsed.input, market), [parsed, market])
  const update = (patch: Partial<FormState>) => setState((current) => ({ ...current, ...patch }))
  const isUsa = market.plan === 'usa'

  return (
    <div className="flex flex-col gap-8">
      <p>{t('intro')}</p>
      <form className="flex flex-col gap-8" onSubmit={(event) => event.preventDefault()}>
        <MarketFields marketId={market.id} onChange={(marketId) => update({ marketId })} />
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-xl font-semibold text-tcg-heading">{t('own.legend')}</legend>
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
        <TeamsEditor
          teams={state.teams}
          invalid={parsed.invalid}
          onChange={(teams) => update({ teams })}
          onAdd={() => update({ teams: [...state.teams, newTeam(nextTeamKey.current++)] })}
        />
      </form>
      <ResultPanel result={result} market={market} />
    </div>
  )
}
