import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MoveButtons } from '../../components/MoveButtons'
import { NumberField } from '../../components/NumberField'
import { pace } from '../../domain/planning'
import { formatPoints } from '../../shared/format'
import { parsePoints } from '../../state/partner-data'

interface PlanRowProps {
  /** Heading of the row («Yo» or the leg's name). */
  title: string
  /** Optional name field (legs) and remove action. */
  alias?: { value: string; onChange: (value: string) => void }
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  forecast: string
  done: string
  onForecast: (value: string) => void
  onDone: (value: string) => void
  forecastLabel: string
  invalidForecast: boolean
  invalidDone: boolean
  daysLeft: number
  children?: ReactNode
}

/** One planning row: forecast for the month, optional points made so far and the daily pace. */
export function PlanRow({ title, alias, onRemove, onMoveUp, onMoveDown, forecast, done, onForecast, onDone, forecastLabel, invalidForecast, invalidDone, daysLeft }: PlanRowProps) {
  const { t, i18n } = useTranslation('calculator')
  const aliasId = useId()
  const points = (value: number) => formatPoints(i18n.language, value)
  const status = pace(parsePoints(forecast) ?? 0, parsePoints(done) ?? 0, daysLeft)
  const showPace = done.trim() !== '' && (parsePoints(forecast) ?? 0) > 0

  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded border border-tcg-surface-strong bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg">{title}</h3>
        {onRemove && (
          <div className="flex items-center gap-3">
            <MoveButtons name={title} onUp={onMoveUp} onDown={onMoveDown} />
            <button type="button" onClick={onRemove} className="text-sm font-semibold text-tcg-primary underline">
              {t('legs.remove', { name: title })}
            </button>
          </div>
        )}
      </div>
      {alias && (
        <div className="flex flex-col gap-1">
          <label htmlFor={aliasId} className="text-sm font-semibold text-tcg-heading">
            {t('legs.alias')}
          </label>
          <input
            id={aliasId}
            type="text"
            maxLength={40}
            autoComplete="off"
            value={alias.value}
            onChange={(event) => alias.onChange(event.target.value)}
            className="rounded border border-tcg-border bg-white px-4 py-3 text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30"
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label={forecastLabel} value={forecast} onChange={onForecast} error={invalidForecast ? t('invalid') : undefined} />
        <NumberField label={t('plan.done')} value={done} onChange={onDone} error={invalidDone ? t('invalid') : undefined} />
      </div>
      {showPace && (
        <p className="text-sm font-semibold text-tcg-heading">
          {status.missing > 0 ? t('plan.pace', { missing: points(status.missing), perDay: points(status.perDay) }) : t('plan.paceDone')}
        </p>
      )}
    </section>
  )
}
