import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CommissionInput, CommissionResult, Market } from '../../domain/commission'
import { reverseEngineer, scenarioForOwnExtra } from '../../domain/scenarios'
import { NumberField } from '../../components/NumberField'
import { formatAmount } from '../../shared/format'
import { parsePoints } from '../../state/partner-data'
import { ScenarioCard } from './ScenarioCard'

interface ReverseEngineeringPanelProps {
  input: CommissionInput
  market: Market
  current: CommissionResult
  legNames: readonly string[]
  /** Initial values (used by tests). */
  initialTarget?: string
  initialOwn?: string
}

/**
 * Tab 3 content (D-021): a target commission, three scenarios and a manual own-effort control.
 * Everything is computed from the real data without modifying it; nothing is stored.
 */
export function ReverseEngineeringPanel({ input, market, current, legNames, initialTarget = '', initialOwn }: ReverseEngineeringPanelProps) {
  const { t, i18n } = useTranslation('calculator')
  const sliderId = useId()
  const [target, setTarget] = useState(initialTarget)
  const [manualOwn, setManualOwn] = useState<string | undefined>(initialOwn)
  const targetAmount = parsePoints(target) ?? 0
  const result = useMemo(() => (targetAmount > 0 ? reverseEngineer(input, market, targetAmount) : null), [input, market, targetAmount])

  const ownMaximum = result?.ownOnly.status === 'ok' ? Math.ceil(result.ownOnly.scenario.ownExtra) : 0
  const defaultOwn = result?.balanced.status === 'ok' ? result.balanced.scenario.ownExtra : 0
  const own = manualOwn === undefined ? defaultOwn : (parsePoints(manualOwn) ?? 0)
  const manual = useMemo(
    () => (result && !result.alreadyReached ? scenarioForOwnExtra(input, market, targetAmount, own) : null),
    [result, input, market, targetAmount, own],
  )

  return (
    <div className="flex flex-col gap-6">
      <p>{t('reverse.intro')}</p>
      <NumberField label={t('reverse.target', { currency: market.currency })} value={target} onChange={setTarget} />

      {result?.alreadyReached && (
        <p className="rounded bg-tcg-surface px-4 py-3 font-semibold text-tcg-heading">
          {t('reverse.reached', { amount: formatAmount(i18n.language, current.amount, market.currency) })}
        </p>
      )}

      {result && !result.alreadyReached && (
        <>
          <ScenarioCard kind="ownOnly" outcome={result.ownOnly} input={input} market={market} legNames={legNames} />
          <ScenarioCard kind="balanced" outcome={result.balanced} input={input} market={market} legNames={legNames} />
          <ScenarioCard kind="moreTeam" outcome={result.moreTeam} input={input} market={market} legNames={legNames} />
          {manual && (
            <ScenarioCard kind="manual" outcome={manual} input={input} market={market} legNames={legNames}>
              <p className="text-sm">{t('reverse.manual.help')}</p>
              {ownMaximum > 0 && (
                <div className="flex flex-col gap-1">
                  {/* Same label as the number field below, which shows it; screen readers still get it. */}
                  <label htmlFor={sliderId} className="sr-only">
                    {t('reverse.manual.label')}
                  </label>
                  <input
                    id={sliderId}
                    type="range"
                    min={0}
                    max={ownMaximum}
                    step={1}
                    value={Math.min(own, ownMaximum)}
                    onChange={(event) => setManualOwn(event.target.value)}
                    className="accent-tcg-primary"
                  />
                </div>
              )}
              <NumberField label={t('reverse.manual.label')} value={manualOwn ?? String(defaultOwn)} onChange={setManualOwn} />
            </ScenarioCard>
          )}
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>{t('reverse.notes.assumption')}</li>
            <li>{t('reverse.notes.proposal')}</li>
            <li>{t('simulation.next.newPartners')}</li>
            <li>{t('reverse.notes.estimate')}</li>
          </ul>
        </>
      )}
    </div>
  )
}
