import { Button } from '@anibelin007/tcg-ui'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldId, LegDraft } from '../state/partner-data'
import { useLegName } from './leg-name'
import { NumberField } from './NumberField'

interface LegFieldsProps {
  legs: readonly LegDraft[]
  invalid: readonly FieldId[]
  onChange: (legs: readonly LegDraft[]) => void
  onAdd: () => void
}

function AliasField({ value, onChange, label, help }: { value: string; onChange: (value: string) => void; label: string; help: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-tcg-heading">
        {label}
      </label>
      <input
        id={id}
        type="text"
        maxLength={40}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-help`}
        className="rounded border border-tcg-border bg-white px-4 py-3 text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30"
      />
      <p id={`${id}-help`} className="text-sm">
        {help}
      </p>
    </div>
  )
}

/** Direct partners (legs): an optional first name and the VE, as in the Online Office list. */
export function LegFields({ legs, invalid, onChange, onAdd }: LegFieldsProps) {
  const { t } = useTranslation('calculator')
  const legName = useLegName()
  const set = (id: string, patch: Partial<LegDraft>) => onChange(legs.map((leg) => (leg.id === id ? { ...leg, ...patch } : leg)))
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-xl font-semibold text-tcg-heading">{t('legs.legend')}</legend>
      <p className="text-sm">{t('legs.help')}</p>
      {legs.length === 0 && <p className="text-sm italic">{t('legs.empty')}</p>}
      {legs.map((leg, index) => (
        <section key={leg.id} aria-label={legName(legs, index)} className="flex flex-col gap-4 rounded border border-tcg-surface-strong bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg">{legName(legs, index)}</h3>
            <button
              type="button"
              className="text-sm font-semibold text-tcg-primary underline"
              onClick={() => onChange(legs.filter((candidate) => candidate.id !== leg.id))}
            >
              {t('legs.remove', { name: legName(legs, index) })}
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AliasField label={t('legs.alias')} help={t('legs.aliasHelp')} value={leg.alias} onChange={(alias) => set(leg.id, { alias })} />
            <NumberField
              label={t('legs.volume')}
              value={leg.volume}
              onChange={(volume) => set(leg.id, { volume })}
              error={invalid.includes(`leg-${index}`) ? t('invalid') : undefined}
            />
          </div>
        </section>
      ))}
      <Button className="self-start" onClick={onAdd}>
        {t('legs.add')}
      </Button>
    </fieldset>
  )
}
