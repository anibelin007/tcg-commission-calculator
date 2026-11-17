import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { simulateNextLevel, simulateTargetAmount, type CommissionInput, type CommissionResult, type Market } from '../../domain/commission'
import { CommissionChart } from './CommissionChart'
import { parsePoints } from './form-model'
import { formatAmount, formatPoints } from './format'
import { NumberField } from './NumberField'

interface SimulationPanelProps {
  input: CommissionInput
  market: Market
  current: CommissionResult
}

const sectionTitle = 'text-lg font-semibold text-tcg-heading'

/** Next level, target amount and step chart (PF-02 to PF-04). Wording per BR-21. */
export function SimulationPanel({ input, market, current }: SimulationPanelProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const points = (value: number) => formatPoints(locale, value)
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const [target, setTarget] = useState('')
  const next = useMemo(() => simulateNextLevel(input, market), [input, market])
  const targetAmount = parsePoints(target)
  const targetSimulation = useMemo(
    () => (targetAmount ? simulateTargetAmount(input, market, targetAmount) : undefined),
    [input, market, targetAmount],
  )

  return (
    <section className="flex flex-col gap-6 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6" aria-labelledby="simulation-title">
      <div className="flex flex-col gap-1">
        <h2 id="simulation-title" className="text-2xl">
          {t('simulation.title')}
        </h2>
        <p className="text-sm">{t('simulation.intro')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className={sectionTitle}>{t('simulation.next.title')}</h3>
        {next === null ? (
          <p>{t('simulation.next.top')}</p>
        ) : (
          <>
            <p>{t('simulation.next.for', { level: next.level })}</p>
            <ul className="flex flex-col gap-2 text-sm">
              {next.paths.map((path, index) => (
                <li key={index} className="rounded bg-tcg-page px-3 py-2">
                  {next.paths.length > 1 && <p className="font-semibold">{t('simulation.next.option', { number: index + 1 })}</p>}
                  {[path.own, ...(path.team ? [path.team] : [])].map((criterion) => (
                    <p key={criterion.measure}>
                      {criterion.missing > 0
                        ? t('simulation.next.missing', {
                            measure: t(`simulation.measures.${criterion.measure}`),
                            missing: points(criterion.missing),
                            min: points(criterion.min),
                          })
                        : t('simulation.next.met', { measure: t(`simulation.measures.${criterion.measure}`) })}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-1 rounded bg-tcg-surface px-4 py-3">
              <p className="font-semibold text-tcg-heading">
                {t('simulation.next.ownOnly', { extra: points(next.extraOwn), total: points(input.customerTurnover + next.extraOwn) })}
              </p>
              <p>
                {t('simulation.next.amount', {
                  level: next.level,
                  amount: money(next.result.amount),
                  delta: money(next.result.amount - current.amount),
                })}
              </p>
            </div>
            <p className="text-sm italic">{t('simulation.next.newPartners')}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className={sectionTitle}>{t('simulation.target.title')}</h3>
        <NumberField label={t('simulation.target.label', { currency: market.currency })} value={target} onChange={setTarget} />
        {targetSimulation === null && <p>{t('simulation.target.unreachable')}</p>}
        {targetSimulation && targetSimulation.extraOwn === 0 && <p>{t('simulation.target.reached', { amount: money(current.amount) })}</p>}
        {targetSimulation && targetSimulation.extraOwn > 0 && (
          <p className="font-semibold text-tcg-heading">
            {t('simulation.target.needed', {
              extra: points(targetSimulation.extraOwn),
              total: points(input.customerTurnover + targetSimulation.extraOwn),
              level: targetSimulation.result.level,
              amount: money(targetSimulation.result.amount),
            })}
          </p>
        )}
      </div>

      <CommissionChart input={input} market={market} current={current} nextExtraOwn={next?.extraOwn ?? null} />
    </section>
  )
}
