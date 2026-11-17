import { Button } from '@anibelin007/tcg-ui'
import { useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TARGET_LEVELS, levelDefinition, PLANS, type TargetLevel } from '../../domain/commission'
import { businessConversationsFor, checkTarget, latestJoiningMonth, daysLeftInMonth, generationShares, motivationKey, planToInput, surplusOverLevel } from '../../domain/planning'
import { formatAmount, formatPoints } from '../../shared/format'
import { usePartnerData } from '../../state/partner-data-context'
import { PLAN_STORAGE_KEY, initialPlanData, isEmptyPlanData, isPlanData, parsePlanData, targetLevelOf, type PlanData, fictitiousLegCount, plannedMonthOf } from '../../state/plan-data'
import { useRememberableState } from '../../state/use-session-state'
import { moveItem } from '../../shared/move-item'
import { compareYearMonth, formatYearMonth, monthLabel, nextMonths, yearMonthOf } from '../../shared/year-month'
import { CommissionChart } from './CommissionChart'
import { PlanRow } from './PlanRow'

const legendClass = 'mb-2 text-xl font-semibold text-tcg-heading'

/**
 * Tab 2 «Planificar mi meta» (design §7): choose a target level, enter what you and each leg
 * expect to make, and compare the plan with the target live. Based on the team planner sheet.
 */
export function PlanningPage() {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const targetId = useId()
  const monthId = useId()
  const { market, parsed: real, newLegId } = usePartnerData()
  const { state: data, setState: setData, reset, remember, setRemember } = useRememberableState<PlanData>(PLAN_STORAGE_KEY, initialPlanData, isPlanData, isEmptyPlanData)
  const update = useCallback((patch: Partial<PlanData>) => setData((current) => ({ ...current, ...patch })), [setData])
  const shares = useMemo(() => generationShares(real.input.generationVolumes), [real.input.generationVolumes])
  const parsed = useMemo(() => parsePlanData(data, shares), [data, shares])
  const target = targetLevelOf(data)
  const check = useMemo(() => (target ? checkTarget(parsed.plan, market, target) : null), [parsed.plan, market, target])
  const result = check?.result
  // Today, fixed when the tab opens (the statement month closes on its last day).
  const [today] = useState(() => new Date())
  const daysLeft = daysLeftInMonth(today)
  const thisMonth = yearMonthOf(today)
  const planned = plannedMonthOf(data, thisMonth)
  const monthOrder = compareYearMonth(planned, thisMonth)
  const isCurrentMonth = monthOrder === 0
  const monthOptions = monthOrder < 0 ? [planned, ...nextMonths(thisMonth, 13)] : nextMonths(thisMonth, 13)
  const plannedLabel = monthLabel(locale, planned)
  const joining = latestJoiningMonth(planned)
  const joiningLate = compareYearMonth(joining, thisMonth) < 0
  const points = (value: number) => formatPoints(locale, value)
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const measure = (key: string) => t(`simulation.measures.${key}`)
  const newPartners = fictitiousLegCount(data)
  const legName = (index: number) => data.legs[index]?.alias.trim() || t('legs.defaultName', { number: index + 1 })

  return (
    <div className="flex flex-col gap-6">
      <p>{t('plan.intro')}</p>
      <label className="flex items-start gap-3 rounded border border-tcg-surface-strong bg-white p-4">
        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="mt-1 size-5 accent-tcg-primary" />
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-tcg-heading">{t('plan.remember')}</span>
          <span className="text-sm">{t('plan.rememberHelp')}</span>
        </span>
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor={monthId} className="text-xl font-semibold text-tcg-heading">
          {t('plan.month')}
        </label>
        <select
          id={monthId}
          value={formatYearMonth(planned)}
          onChange={(event) => update({ month: event.target.value })}
          className="rounded border border-tcg-border bg-white px-4 py-3 text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30"
        >
          {monthOptions.map((option) => (
            <option key={formatYearMonth(option)} value={formatYearMonth(option)}>
              {monthLabel(locale, option)}
            </option>
          ))}
        </select>
        {monthOrder < 0 && <p className="text-sm font-semibold">{t('plan.pastMonth')}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={targetId} className="text-xl font-semibold text-tcg-heading">
          {t('plan.target')}
        </label>
        <select
          id={targetId}
          value={data.target}
          onChange={(event) => update({ target: event.target.value })}
          className="rounded border border-tcg-border bg-white px-4 py-3 text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30"
        >
          <option value="">{t('plan.choose')}</option>
          {TARGET_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t('result.level', { level })}
            </option>
          ))}
        </select>
        {target && (
          <p className="text-sm">
            {t('plan.meaning', { level: target })}{' '}
            {levelDefinition(PLANS[market.plan], target)
              .qualification.map((path) =>
                [path.own, ...(path.team ? [path.team] : [])].map((r) => `${measure(r.measure)} ≥ ${points(r.min)}`).join(` ${t('plan.and')} `),
              )
              .join(` ${t('plan.or')} `)}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className={legendClass}>{t('plan.forecastLegend')}</legend>
        <p className="text-sm">{isCurrentMonth ? t('plan.daysLeft', { days: daysLeft }) : monthOrder > 0 ? t('plan.futureMonth', { month: plannedLabel }) : ''}</p>
        <PlanRow
          title={t('plan.me')}
          forecastLabel={t('plan.ownForecast')}
          forecast={data.ownForecast}
          done={data.ownDone}
          onForecast={(ownForecast) => update({ ownForecast })}
          onDone={(ownDone) => update({ ownDone })}
          invalidForecast={parsed.invalid.includes('ownForecast')}
          invalidDone={parsed.invalid.includes('ownDone')}
          daysLeft={daysLeft}
          showDone={isCurrentMonth}
        />
        {data.legs.map((leg, index) => {
          const setLeg = (patch: Partial<typeof leg>) => update({ legs: data.legs.map((l) => (l.id === leg.id ? { ...l, ...patch } : l)) })
          return (
            <PlanRow
              key={leg.id}
              title={legName(index)}
              alias={{ value: leg.alias, onChange: (alias) => setLeg({ alias }) }}
              fictitious={{ checked: leg.fictitious === true, onChange: (fictitious) => setLeg({ fictitious }) }}
              onRemove={() => update({ legs: data.legs.filter((l) => l.id !== leg.id) })}
              onMoveUp={index > 0 ? () => update({ legs: moveItem(data.legs, index, -1) }) : undefined}
              onMoveDown={index < data.legs.length - 1 ? () => update({ legs: moveItem(data.legs, index, 1) }) : undefined}
              forecastLabel={t('plan.legForecast')}
              forecast={leg.volume}
              done={leg.done}
              onForecast={(volume) => setLeg({ volume })}
              onDone={(done) => setLeg({ done })}
              invalidForecast={parsed.invalid.includes(`leg-${index}`)}
              invalidDone={parsed.invalid.includes(`legDone-${index}`)}
              daysLeft={daysLeft}
              showDone={isCurrentMonth}
            />
          )
        })}
        <Button className="self-start" onClick={() => update({ legs: [...data.legs, { id: newLegId(), alias: '', volume: '', done: '' }] })}>
          {t('legs.add')}
        </Button>
      </fieldset>

      {newPartners > 0 && (
        <section aria-label={t('plan.prospectingTitle')} className="flex flex-col gap-2 rounded border-2 border-tcg-primary bg-white p-4 sm:p-6">
          <h2 className="text-xl">{t('plan.prospectingTitle')}</h2>
          <p className="font-semibold text-tcg-heading">
            {joiningLate
              ? t('plan.prospectingLate', { count: newPartners, month: plannedLabel, joinMonth: monthLabel(locale, joining) })
              : t('plan.prospecting', { count: newPartners, cn: businessConversationsFor(newPartners), month: plannedLabel, joinMonth: monthLabel(locale, joining) })}
          </p>
          <p className="text-sm">{t('plan.prospectingNote')}</p>
        </section>
      )}

      {check && result && target && (
        <section aria-label={t('plan.resultTitle')} className="flex flex-col gap-4 rounded border border-tcg-surface-strong bg-white p-4 sm:p-6">
          <h2 className="text-2xl">{t('plan.resultTitle', { month: plannedLabel })}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {check.paths.map((path, index) => (
              <li key={index} className="rounded bg-tcg-page px-3 py-2">
                {check.paths.length > 1 && <p className="font-semibold">{t('simulation.next.option', { number: index + 1 })}</p>}
                {path.requirements.map((r) => (
                  <p key={r.measure}>
                    {r.missing > 0
                      ? t('plan.requirementMissing', { measure: measure(r.measure), actual: points(r.actual), min: points(r.min), missing: points(r.missing) })
                      : t('plan.requirementMet', { measure: measure(r.measure), actual: points(r.actual), min: points(r.min) })}
                  </p>
                ))}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            {t('plan.volumes', { tt: points(result.volumes.tt), tt1: points(result.volumes.tt1), tt2: points(result.volumes.tt2), tt3: points(result.volumes.tt3) })}
          </p>
          <div className="flex flex-col gap-3 rounded bg-tcg-surface px-4 py-4">
            {check.met ? (
              <p className="text-lg font-semibold text-tcg-primary">{t('plan.targetMet', { level: target })}</p>
            ) : (
              <p className="font-semibold text-tcg-heading">
                {t('plan.ownNeeded', { own: points(check.ownNeeded), extra: points(Math.max(0, check.ownNeeded - parsed.plan.ownCt)), level: target })}
              </p>
            )}
            <p className="font-semibold text-tcg-heading">
              {result.level === null
                ? t('plan.reachedNone')
                : `${t('plan.reached', { level: result.level })} · ${t(`plan.motivation.${motivationKey(result.level)}`)}`}
            </p>
            {result.level !== null && (
              <p className="text-sm">{t('plan.surplus', { percent: new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(surplusOverLevel(parsed.plan, market, result.level as TargetLevel)) })}</p>
            )}
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <span className="font-semibold text-tcg-heading">{t('plan.commission')}</span>
              <span className="text-3xl font-semibold text-tcg-primary tabular-nums sm:text-4xl">{money(result.amount)}</span>
            </div>
            {!check.met && (
              <p className="text-sm font-semibold">
                {t('plan.commissionWithOwn', { own: points(check.ownNeeded), amount: money(check.resultWithOwnNeeded.amount) })}
              </p>
            )}
          </div>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>{t('plan.approximate')}</li>
            <li>{t('simulation.next.newPartners')}</li>
            <li>{t('reverse.notes.estimate')}</li>
          </ul>
        </section>
      )}

      {result && <CommissionChart input={planToInput(parsed.plan)} market={market} current={result} nextExtraOwn={check && !check.met ? check.ownNeeded - parsed.plan.ownCt : null} />}

      {!isEmptyPlanData(data) && (
        <button type="button" onClick={reset} className="self-end text-sm font-semibold text-tcg-primary underline">
          {t('plan.clear')}
        </button>
      )}
    </div>
  )
}
