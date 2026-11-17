import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { simulateTargetAmount, type CommissionInput, type CommissionResult, type Market } from '../../domain/commission'
import { NumberField } from '../../components/NumberField'
import { formatAmount, formatPoints } from '../../shared/format'
import { parsePoints } from '../../state/partner-data'

interface TargetAmountPanelProps {
  input: CommissionInput
  market: Market
  current: CommissionResult
  /** Initial value of the target field (used by tests). */
  initialTarget?: string
}

/**
 * «¿Cuántos puntos necesitarías para…?» (PF-03). For now only the own-CT route; the team
 * scenarios come next (design in docs/architecture/three-tabs-design.md). Wording per BR-21.
 */
export function TargetAmountPanel({ input, market, current, initialTarget = '' }: TargetAmountPanelProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const points = (value: number) => formatPoints(locale, value)
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const [target, setTarget] = useState(initialTarget)
  const targetAmount = parsePoints(target)
  const simulation = useMemo(
    () => (targetAmount ? simulateTargetAmount(input, market, targetAmount) : undefined),
    [input, market, targetAmount],
  )

  return (
    <section className="flex flex-col gap-4 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6" aria-label={t('simulation.target.title')}>
      <h3 className="text-lg font-semibold text-tcg-heading">{t('simulation.target.title')}</h3>
      <NumberField label={t('simulation.target.label', { currency: market.currency })} value={target} onChange={setTarget} />
      {simulation === null && <p>{t('simulation.target.unreachable')}</p>}
      {simulation && simulation.extraOwn === 0 && <p>{t('simulation.target.reached', { amount: money(current.amount) })}</p>}
      {simulation && simulation.extraOwn > 0 && (
        <p className="font-semibold text-tcg-heading">
          {t('simulation.target.needed', {
            extra: points(simulation.extraOwn),
            total: points(input.customerTurnover + simulation.extraOwn),
            level: simulation.result.level,
            amount: money(simulation.result.amount),
          })}
        </p>
      )}
    </section>
  )
}
