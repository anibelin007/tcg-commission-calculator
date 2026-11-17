import { useTranslation } from 'react-i18next'
import type { CommissionResult, Market } from '../../domain/commission'
import { formatAmount, formatFactor, formatPoints, formatRate } from './format'

interface ResultPanelProps {
  result: CommissionResult
  market: Market
}

const cell = 'px-3 py-2 text-right tabular-nums'

/** Breakdown of the estimated commission. Wording follows BR-21: an estimate, never a promise. */
export function ResultPanel({ result, market }: ResultPanelProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const points = (value: number) => formatPoints(locale, value)
  const limited = result.strongestTeam && result.strongestTeam.pointsAfter < result.strongestTeam.pointsBefore

  return (
    <section aria-live="polite" className="flex flex-col gap-4 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6">
      <h2 className="text-2xl">{t('result.title')}</h2>

      {result.level === null ? (
        <p>{t('result.noLevel')}</p>
      ) : (
        <>
          <p className="text-lg font-semibold text-tcg-primary">{t('result.level', { level: result.level })}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-tcg-surface-strong text-tcg-heading">
                <tr>
                  <th className="px-3 py-2 text-left">{t('result.concept')}</th>
                  <th className={cell}>{t('result.volume')}</th>
                  <th className={cell}>{t('result.rate')}</th>
                  <th className={cell}>{t('result.points')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2">{t(result.planId === 'usa' ? 'result.ownUsa' : 'result.own')}</td>
                  <td className={cell}>{points(result.ownVolume)}</td>
                  <td className={cell}>{formatRate(locale, result.ownRate)}</td>
                  <td className={cell}>{points(result.ownPoints)}</td>
                </tr>
                {result.generations.map((generation) => (
                  <tr key={generation.generation}>
                    <td className="px-3 py-2">{t('result.generation', { number: generation.generation })}</td>
                    <td className={cell}>{points(generation.volume)}</td>
                    <td className={cell}>{formatRate(locale, generation.rate)}</td>
                    <td className={cell}>{points(generation.points)}</td>
                  </tr>
                ))}
                {limited && result.strongestTeam && (
                  <tr>
                    <td className="px-3 py-2" colSpan={3}>
                      {t('result.limit', {
                        team: result.strongestTeam.index + 1,
                        volume: points(result.strongestTeam.volume),
                        limit: points(result.strongestTeam.limit),
                      })}
                    </td>
                    <td className={cell}>{points(result.strongestTeam.pointsAfter - result.strongestTeam.pointsBefore)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-tcg-surface-strong font-semibold text-tcg-heading">
                <tr>
                  <td className="px-3 py-2" colSpan={3}>
                    {t('result.totalPoints')}
                  </td>
                  <td className={cell}>{points(result.totalPoints)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2" colSpan={3}>
                    {t('result.factor')}
                  </td>
                  <td className={cell}>× {formatFactor(locale, result.pointsFactor)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="flex flex-wrap items-baseline justify-between gap-2 rounded bg-tcg-surface px-4 py-3">
            <span className="font-semibold text-tcg-heading">{t('result.amount')}</span>
            <span className="text-3xl font-semibold text-tcg-primary tabular-nums">
              {formatAmount(locale, result.amount, result.currency)}
            </span>
          </p>
          <p className="text-sm">
            {t('result.volumes', {
              tt: points(result.volumes.tt),
              tt1: points(result.volumes.tt1),
              tt2: points(result.volumes.tt2),
              tt3: points(result.volumes.tt3),
            })}
          </p>
        </>
      )}

      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
        {result.payout === 'voucher' && market.payoutThreshold !== null && (
          <li className="font-semibold text-tcg-heading">
            {t('result.notes.voucher', { threshold: formatAmount(locale, market.payoutThreshold, market.currency) })}
          </li>
        )}
        {limited && <li>{t('result.notes.provisionalLimit')}</li>}
        {market.taxSpecificSettlement && <li>{t('result.notes.taxSettlement')}</li>}
        <li>{t('result.notes.exceptions')}</li>
        <li>{t('result.notes.bonuses')}</li>
      </ul>
    </section>
  )
}
