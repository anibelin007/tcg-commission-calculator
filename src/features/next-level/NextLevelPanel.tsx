import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { simulateNextLevel, type CommissionInput, type CommissionResult, type Market } from '../../domain/commission'
import { formatAmount, formatPoints } from '../../shared/format'

interface NextLevelPanelProps {
  input: CommissionInput
  market: Market
  current: CommissionResult
}

const sectionTitle = 'text-lg font-semibold text-tcg-heading'

/** What is missing for the next level, reached with own CT only (PF-02). Wording per BR-21. */
export function NextLevelPanel({ input, market, current }: NextLevelPanelProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const points = (value: number) => formatPoints(locale, value)
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const next = useMemo(() => simulateNextLevel(input, market), [input, market])

  return (
    <section className="flex flex-col gap-6 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6" aria-label={t('simulation.next.title')}>
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

    </section>
  )
}
