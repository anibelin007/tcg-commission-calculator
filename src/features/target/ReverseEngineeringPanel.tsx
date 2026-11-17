import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { computeCommission, type CommissionInput, type Market } from '../../domain/commission'
import { partnersNeeded, type PartnersNeeded } from '../../domain/planning'
import { reverseEngineer, scenarioForOwnExtra, type ReverseEngineering, type ScenarioOutcome } from '../../domain/scenarios'
import { formatAmount, formatPoints } from '../../shared/format'
import { ScenarioCard } from './ScenarioCard'

/** Additional legs tried at most in «Más socias». */
const MAX_NEW_PARTNERS = 50

interface ReverseEngineeringPanelProps {
  /** The partner's plan as engine input: willing own CT and the legs she expects. */
  input: CommissionInput
  market: Market
  target: number
  /** Average points per leg, for «Más socias». */
  average: number
  legNames: readonly string[]
}

interface Evaluation {
  readonly reverse: ReverseEngineering
  readonly moreTeam: ScenarioOutcome
  readonly partners: PartnersNeeded | null
}

/**
 * Tab 3 result (design §7): does the plan reach the target? If not, the alternatives: more own
 * CT, more points from the legs (own CT as planned), a combination, and how many more partners.
 */
export function ReverseEngineeringPanel({ input, market, target, average, legNames }: ReverseEngineeringPanelProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const points = (value: number) => formatPoints(locale, value)
  const current = useMemo(() => computeCommission(input, market), [input, market])
  const evaluation = useMemo<Evaluation | null>(() => {
    if (!(target > 0) || current.amount >= target) return null
    return {
      reverse: reverseEngineer(input, market, target),
      moreTeam: scenarioForOwnExtra(input, market, target, 0),
      partners: partnersNeeded(input, market, target, average, MAX_NEW_PARTNERS),
    }
  }, [input, market, target, average, current.amount])

  if (!(target > 0)) return null

  return (
    <div className="flex flex-col gap-6">
      {current.amount >= target ? (
        <p className="rounded bg-tcg-surface px-4 py-3 text-lg font-semibold text-tcg-primary">
          {t('reverse.enough', { level: current.level, amount: money(current.amount) })}
        </p>
      ) : (
        <p className="rounded bg-tcg-surface px-4 py-3 font-semibold text-tcg-heading">
          {current.level === null
            ? t('reverse.notEnoughNoLevel', { missing: money(target - current.amount) })
            : t('reverse.notEnough', { amount: money(current.amount), level: current.level, missing: money(target - current.amount) })}
        </p>
      )}

      {evaluation && (
        <>
          <h2 className="text-2xl">{t('reverse.alternatives')}</h2>
          <ScenarioCard kind="ownOnly" outcome={evaluation.reverse.ownOnly} input={input} market={market} legNames={legNames} />
          <ScenarioCard kind="moreTeam" outcome={evaluation.moreTeam} input={input} market={market} legNames={legNames} />
          <ScenarioCard kind="balanced" outcome={evaluation.reverse.balanced} input={input} market={market} legNames={legNames} />
          <section aria-label={t('reverse.scenarios.partners')} className="flex flex-col gap-2 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6">
            <h2 className="text-xl">{t('reverse.scenarios.partners')}</h2>
            {!(average > 0) ? (
              <p>{t('reverse.partnersNoAverage')}</p>
            ) : evaluation.partners ? (
              <p className="font-semibold text-tcg-heading">
                {t('reverse.partners', {
                  average: points(average),
                  count: evaluation.partners.count,
                  level: evaluation.partners.result.level,
                  amount: money(evaluation.partners.result.amount),
                })}
              </p>
            ) : (
              <p>{t('reverse.partnersNone', { max: MAX_NEW_PARTNERS })}</p>
            )}
            <p className="text-sm italic">{t('reverse.partnersNote')}</p>
          </section>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>{t('reverse.notes.assumption')}</li>
            <li>{t('reverse.notes.proposal')}</li>
            <li>{t('plan.approximate')}</li>
            <li>{t('reverse.notes.estimate')}</li>
          </ul>
        </>
      )}
    </div>
  )
}
