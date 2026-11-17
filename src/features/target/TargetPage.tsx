import { Button } from '@anibelin007/tcg-ui'
import { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MoveButtons } from '../../components/MoveButtons'
import { NumberField } from '../../components/NumberField'
import { moveItem } from '../../shared/move-item'
import { generationShares, planToInput } from '../../domain/planning'
import { usePartnerData } from '../../state/partner-data-context'
import { PLAN_STORAGE_KEY, fictitiousLegCount, isPlanData } from '../../state/plan-data'
import {
  MAX_AVERAGE_LEGS,
  REVERSE_STORAGE_KEY,
  initialReverseData,
  legsFromPlan,
  isEmptyReverseData,
  isReverseData,
  parseReverseData,
  type ReverseData,
  type TeamMode,
} from '../../state/reverse-data'
import { peekRememberableState, useSessionState } from '../../state/use-session-state'
import { ReverseEngineeringPanel } from './ReverseEngineeringPanel'

const legendClass = 'mb-2 text-xl font-semibold text-tcg-heading'

/**
 * Tab 3 «Ingeniería inversa» (design §7): independent of the other tabs and usable from empty.
 * Prefilled from the plan of tab 2 when there is one; changes here never affect other tabs.
 */
export function TargetPage() {
  const { t } = useTranslation('calculator')
  const { market, parsed: real, newLegId } = usePartnerData()
  // The plan of tab 2 as it is when this tab opens (this tab's copy, or the one kept on the device).
  const [plan] = useState(() => peekRememberableState(PLAN_STORAGE_KEY, isPlanData))
  const initial = useCallback(() => initialReverseData(plan), [plan])
  const planFictitious = plan ? fictitiousLegCount(plan) : 0
  const planReal = plan ? plan.legs.length - planFictitious : 0
  const [data, setData, reset] = useSessionState<ReverseData>(REVERSE_STORAGE_KEY, initial, isReverseData, isEmptyReverseData)
  const update = (patch: Partial<ReverseData>) => setData((current) => ({ ...current, ...patch }))
  const shares = useMemo(() => generationShares(real.input.generationVolumes), [real.input.generationVolumes])
  const parsed = useMemo(() => parseReverseData(data, shares), [data, shares])
  const input = useMemo(() => planToInput(parsed.plan), [parsed.plan])
  const legNames =
    data.mode === 'legs'
      ? data.legs.map((leg, index) => leg.alias.trim() || t('legs.defaultName', { number: index + 1 }))
      : parsed.plan.legs.map((_, index) => t('legs.defaultName', { number: index + 1 }))
  const error = (field: string) => (parsed.invalid.includes(field) ? t('invalid') : undefined)

  return (
    <div className="flex flex-col gap-6">
      <p>{t('reverse.intro')}</p>
      <NumberField label={t('reverse.target', { currency: market.currency })} value={data.target} onChange={(target) => update({ target })} error={error('target')} />
      <NumberField label={t('reverse.willingOwn')} help={t('reverse.willingOwnHelp')} value={data.willingOwn} onChange={(willingOwn) => update({ willingOwn })} error={error('willingOwn')} />

      <fieldset className="flex flex-col gap-4">
        <legend className={legendClass}>{t('reverse.team')}</legend>
        <div role="radiogroup" aria-label={t('reverse.team')} className="grid grid-cols-2 gap-2">
          {(['legs', 'average'] as const satisfies readonly TeamMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={data.mode === mode}
              onClick={() => update({ mode })}
              className="rounded border border-tcg-primary px-3 py-2 text-sm font-semibold text-tcg-primary aria-checked:bg-tcg-primary aria-checked:text-white"
            >
              {t(`reverse.modes.${mode}`)}
            </button>
          ))}
        </div>
        {plan && plan.legs.length > 0 && (
          <div className="flex flex-col gap-2 rounded border border-tcg-surface-strong bg-white p-4">
            <p className="text-sm font-semibold text-tcg-heading">{t('reverse.loadFromPlan')}</p>
            <div className="flex flex-wrap gap-2">
              {planReal > 0 && (
                <button type="button" onClick={() => update({ mode: 'legs', legs: legsFromPlan(plan, false) })} className="rounded border border-tcg-primary px-3 py-2 text-sm font-semibold text-tcg-primary">
                  {t('reverse.loadReal', { count: planReal })}
                </button>
              )}
              {planFictitious > 0 && (
                <button type="button" onClick={() => update({ mode: 'legs', legs: legsFromPlan(plan, true) })} className="rounded border border-tcg-primary px-3 py-2 text-sm font-semibold text-tcg-primary">
                  {t('reverse.loadAll', { count: plan.legs.length })}
                </button>
              )}
            </div>
          </div>
        )}
        {data.mode === 'legs' ? (
          <>
            {data.legs.length === 0 && <p className="text-sm italic">{t('legs.empty')}</p>}
            {data.legs.map((leg, index) => (
              <div key={leg.id} className="grid gap-3 rounded border border-tcg-surface-strong bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="flex flex-col gap-1 text-sm font-semibold text-tcg-heading">
                  {t('legs.alias')}
                  <input
                    type="text"
                    maxLength={40}
                    autoComplete="off"
                    value={leg.alias}
                    onChange={(event) => update({ legs: data.legs.map((l) => (l.id === leg.id ? { ...l, alias: event.target.value } : l)) })}
                    className="rounded border border-tcg-border bg-white px-4 py-3 font-normal text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30"
                  />
                </label>
                <NumberField
                  label={t('reverse.expected')}
                  value={leg.volume}
                  onChange={(volume) => update({ legs: data.legs.map((l) => (l.id === leg.id ? { ...l, volume } : l)) })}
                  error={error(`leg-${index}`)}
                />
                <div className="flex items-center gap-3 sm:self-center">
                  <MoveButtons
                    name={legNames[index] ?? ''}
                    onUp={index > 0 ? () => update({ legs: moveItem(data.legs, index, -1) }) : undefined}
                    onDown={index < data.legs.length - 1 ? () => update({ legs: moveItem(data.legs, index, 1) }) : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => update({ legs: data.legs.filter((l) => l.id !== leg.id) })}
                    className="text-sm font-semibold text-tcg-primary underline"
                  >
                    {t('legs.remove', { name: legNames[index] })}
                  </button>
                </div>
              </div>
            ))}
            <Button className="self-start" onClick={() => update({ legs: [...data.legs, { id: newLegId(), alias: '', volume: '' }] })}>
              {t('legs.add')}
            </Button>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label={t('reverse.legCount', { max: MAX_AVERAGE_LEGS })} value={data.legCount} onChange={(legCount) => update({ legCount })} error={error('legCount')} />
            <NumberField label={t('reverse.average')} value={data.average} onChange={(average) => update({ average })} error={error('average')} />
          </div>
        )}
      </fieldset>

      <ReverseEngineeringPanel input={input} market={market} target={parsed.target} average={parsed.average} legNames={legNames} />

      {!isEmptyReverseData(data) && (
        <button type="button" onClick={reset} className="self-end text-sm font-semibold text-tcg-primary underline">
          {t('reverse.reset')}
        </button>
      )}
    </div>
  )
}
