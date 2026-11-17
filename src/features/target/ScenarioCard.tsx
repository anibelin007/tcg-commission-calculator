import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CommissionInput, Market } from '../../domain/commission'
import type { ScenarioKind, ScenarioOutcome } from '../../domain/scenarios'
import { formatAmount, formatPoints } from '../../shared/format'

interface ScenarioCardProps {
  kind: ScenarioKind
  outcome: ScenarioOutcome
  input: CommissionInput
  market: Market
  /** Display name of each leg (alias or «Pata N»), in input order. */
  legNames: readonly string[]
  /** Extra content above the figures (the manual control). */
  children?: ReactNode
}

/**
 * One reverse-engineering scenario (D-021): what own and team points would be needed and
 * what would result, worded as a condition (BR-21).
 */
export function ScenarioCard({ kind, outcome, input, market, legNames, children }: ScenarioCardProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const points = (value: number) => formatPoints(locale, value)
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const scenario = outcome.status === 'ok' ? outcome.scenario : null
  const volumes = scenario?.result.volumes

  return (
    <section aria-label={t(`reverse.scenarios.${kind}`)} className="flex flex-col gap-4 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl">{t(`reverse.scenarios.${kind}`)}</h2>
        {scenario && kind !== 'manual' && (
          <span className={`rounded px-2 py-1 text-xs font-semibold ${scenario.exact ? 'bg-tcg-primary text-white' : 'bg-tcg-surface text-tcg-heading'}`}>
            {t(scenario.exact ? 'reverse.badges.exact' : 'reverse.badges.proposal')}
          </span>
        )}
      </div>
      {children}
      {outcome.status === 'infeasible' && <p>{t(`reverse.infeasible.${outcome.reason}`)}</p>}
      {scenario && volumes && (
        <>
          <p className="font-semibold text-tcg-heading">
            {t('reverse.summary', {
              own: points(scenario.ownExtra),
              team: points(scenario.teamExtra),
              level: scenario.result.level,
              amount: money(scenario.result.amount),
            })}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt>{t('reverse.fields.ownExtra')}</dt>
            <dd className="text-right tabular-nums">+{points(scenario.ownExtra)}</dd>
            <dt>{t('reverse.fields.teamExtra')}</dt>
            <dd className="text-right tabular-nums">+{points(scenario.teamExtra)}</dd>
            {scenario.teamExtra > 0 && (
              <>
                <dt className="col-span-2 mt-2 font-semibold text-tcg-heading">{t('reverse.fields.perLeg')}</dt>
                {scenario.scenario.legExtras.map((extra, index) => (
                  <div key={index} className="col-span-2 grid grid-cols-[1fr_auto] gap-x-4 pl-3">
                    <dt>{legNames[index]}</dt>
                    <dd className="text-right tabular-nums">+{points(extra)}</dd>
                  </div>
                ))}
                {scenario.strategy && <p className="col-span-2 text-xs italic">{t(`reverse.strategies.${scenario.strategy}`)}</p>}
              </>
            )}
            <dt className="mt-2">{t('reverse.fields.finalCt')}</dt>
            <dd className="mt-2 text-right tabular-nums">{points(input.customerTurnover + scenario.ownExtra)}</dd>
            {(['tt', 'tt1', 'tt2', 'tt3'] as const).map((measure) => (
              <div key={measure} className="col-span-2 grid grid-cols-[1fr_auto] gap-x-4">
                <dt>{t('reverse.fields.finalMeasure', { measure: t(`simulation.measures.${measure}`) })}</dt>
                <dd className="text-right tabular-nums">{points(volumes[measure])}</dd>
              </div>
            ))}
            <dt>{t('reverse.fields.level')}</dt>
            <dd className="text-right tabular-nums">{scenario.result.level}</dd>
            <dt className="font-semibold text-tcg-heading">{t('reverse.fields.amount')}</dt>
            <dd className="text-right text-lg font-semibold text-tcg-primary tabular-nums">{money(scenario.result.amount)}</dd>
            <dt>{t('reverse.fields.difference')}</dt>
            <dd className="text-right tabular-nums">+{money(scenario.difference)}</dd>
          </dl>
        </>
      )}
    </section>
  )
}
