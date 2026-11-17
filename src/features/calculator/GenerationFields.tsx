import { Button } from '@anibelin007/tcg-ui'
import { useTranslation } from 'react-i18next'
import { MAX_GENERATION_FIELDS, parsePoints, type FieldId } from './form-model'
import { formatPoints } from './format'
import { NumberField } from './NumberField'

interface GenerationFieldsProps {
  values: readonly string[]
  /** Prefix of the field IDs used for validation messages. */
  fieldPrefix: 'generation' | 'breakdown'
  invalid: readonly FieldId[]
  onChange: (values: readonly string[]) => void
  onAdd?: () => void
}

/** Points per generation; the last possible field holds generation 10 and deeper. */
export function GenerationFields({ values, fieldPrefix, invalid, onChange, onAdd }: GenerationFieldsProps) {
  const { t, i18n } = useTranslation('calculator')
  const total = values.reduce((sum, raw) => sum + (parsePoints(raw) ?? 0), 0)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {values.map((raw, index) => {
          const deep = index === MAX_GENERATION_FIELDS - 1
          return (
            <NumberField
              key={index}
              label={deep ? t('generations.deep') : t('generations.generation', { number: index + 1 })}
              help={deep ? t('generations.deepHelp') : undefined}
              value={raw}
              onChange={(value) => onChange(values.map((current, i) => (i === index ? value : current)))}
              error={invalid.includes(`${fieldPrefix}-${index}`) ? t('invalid') : undefined}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">{t('generations.total', { volume: formatPoints(i18n.language, total) })}</p>
        {onAdd && values.length < MAX_GENERATION_FIELDS && (
          <Button variant="secondary" onClick={onAdd}>
            {t('generations.add')}
          </Button>
        )}
      </div>
    </div>
  )
}
