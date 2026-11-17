import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { commissionCurve, computeCommission, type CommissionInput, type CommissionResult, type Market } from '../../domain/commission'
import { niceTicks } from './chart-scale'
import { formatAmount, formatPoints } from '../../shared/format'

interface CommissionChartProps {
  input: CommissionInput
  market: Market
  current: CommissionResult
  /** Extra own points to the next level, to keep the next jump in view. */
  nextExtraOwn: number | null
}

const WIDTH = 640
const HEIGHT = 260
const MARGIN = { top: 16, right: 16, bottom: 40, left: 72 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom

/**
 * Single-series step chart: estimated commission against own CT, team unchanged (PF-04).
 * Brand colour for the mark, text tokens for labels, hairline grid, crosshair + tooltip on
 * hover/focus; the keyboard readout (arrow keys) reaches every value and the next-level summary
 * states the key jump in text (PO: only the next level matters).
 */
export function CommissionChart({ input, market, current, nextExtraOwn }: CommissionChartProps) {
  const { t, i18n } = useTranslation('calculator')
  const locale = i18n.language
  const [hoverCt, setHoverCt] = useState<number | null>(null)
  const ct = input.customerTurnover
  const maxOwn = Math.max(1000, ct * 1.5, nextExtraOwn !== null ? (ct + nextExtraOwn) * 1.2 : 0)
  const curve = useMemo(() => commissionCurve(input, market, maxOwn), [input, market, maxOwn])
  const xTicks = niceTicks(maxOwn)
  const yTicks = niceTicks(Math.max(...curve.map((point) => point.amount), current.amount, 1))
  const xMax = xTicks.at(-1)!
  const yMax = yTicks.at(-1)!
  const x = (value: number) => MARGIN.left + (value / xMax) * PLOT_W
  const y = (value: number) => MARGIN.top + PLOT_H - (value / yMax) * PLOT_H
  const line = curve.map((point, i) => `${i === 0 ? 'M' : 'L'}${x(point.ownTurnover).toFixed(1)},${y(point.amount).toFixed(1)}`).join(' ')
  const area = `${line} L${x(curve.at(-1)!.ownTurnover).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`
  const money = (value: number) => formatAmount(locale, value, market.currency)
  const compactMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: market.currency, notation: 'compact', maximumFractionDigits: 1 }).format(value)
  const levelName = (level: number | null) => (level === null ? t('simulation.chart.noLevel') : t('result.level', { level }))
  const hover = hoverCt === null ? null : computeCommission({ ...input, customerTurnover: hoverCt }, market)

  const pointerToCt = (clientX: number, svg: SVGSVGElement) => {
    const box = svg.getBoundingClientRect()
    const svgX = ((clientX - box.left) / box.width) * WIDTH
    const value = ((svgX - MARGIN.left) / PLOT_W) * xMax
    return Math.min(xMax, Math.max(0, Math.round(value)))
  }

  return (
    <figure className="flex flex-col gap-2">
      <figcaption>
        <p className="text-lg font-semibold text-tcg-heading">{t('simulation.chart.title')}</p>
        <p className="text-sm">{t('simulation.chart.subtitle')}</p>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label={t('simulation.chart.title')}
          tabIndex={0}
          onPointerMove={(event) => setHoverCt(pointerToCt(event.clientX, event.currentTarget))}
          onPointerLeave={() => setHoverCt(null)}
          onFocus={() => setHoverCt(ct)}
          onBlur={() => setHoverCt(null)}
          onKeyDown={(event) => {
            const step = xMax / 100
            if (event.key === 'ArrowRight') setHoverCt((value) => Math.min(xMax, Math.round((value ?? ct) + step)))
            if (event.key === 'ArrowLeft') setHoverCt((value) => Math.max(0, Math.round((value ?? ct) - step)))
          }}
        >
          {yTicks.map((tick) => (
            <g key={`y${tick}`}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} className="stroke-tcg-surface-strong" strokeWidth={1} />
              <text x={MARGIN.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-tcg-body text-[11px]">
                {compactMoney(tick)}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <text key={`x${tick}`} x={x(tick)} y={HEIGHT - MARGIN.bottom + 16} textAnchor="middle" className="fill-tcg-body text-[11px]">
              {formatPoints(locale, tick)}
            </text>
          ))}
          <text x={MARGIN.left + PLOT_W / 2} y={HEIGHT - 4} textAnchor="middle" className="fill-tcg-body text-[11px]">
            {t('simulation.chart.xAxis')}
          </text>
          <path d={area} className="fill-tcg-primary" fillOpacity={0.1} />
          <path d={line} className="stroke-tcg-primary" fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(Math.min(ct, xMax))} cy={y(current.amount)} r={5} className="fill-tcg-primary stroke-white" strokeWidth={2} />
          <text x={x(Math.min(ct, xMax))} y={y(current.amount) - 12} textAnchor="middle" className="fill-tcg-heading text-[11px] font-semibold">
            {t('simulation.chart.current')}
          </text>
          {hover && hoverCt !== null && (
            <g pointerEvents="none">
              <line x1={x(hoverCt)} x2={x(hoverCt)} y1={MARGIN.top} y2={y(0)} className="stroke-tcg-body" strokeWidth={1} />
              <circle cx={x(hoverCt)} cy={y(hover.amount)} r={4} className="fill-tcg-primary stroke-white" strokeWidth={2} />
            </g>
          )}
        </svg>
        {hover && hoverCt !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 rounded border border-tcg-surface-strong bg-white px-2 py-1 text-xs text-tcg-heading shadow-xs"
            style={{ left: `${(x(hoverCt) / WIDTH) * 100}%`, transform: hoverCt > xMax / 2 ? 'translateX(-105%)' : 'translateX(5%)' }}
          >
            {t('simulation.chart.tooltip', { ct: formatPoints(locale, hoverCt), amount: money(hover.amount), level: levelName(hover.level) })}
          </div>
        )}
      </div>
    </figure>
  )
}
