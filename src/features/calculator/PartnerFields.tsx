import { Button } from '@anibelin007/tcg-ui'
import { useTranslation } from 'react-i18next'
import type { FieldId, PartnerDraft } from './form-model'
import { NumberField } from './NumberField'

interface PartnerFieldsProps {
  partners: readonly PartnerDraft[]
  invalid: readonly FieldId[]
  onChange: (partners: readonly PartnerDraft[]) => void
  onAdd: () => void
}

/** VE of each direct partner (= each team), as in the Online Office list of direct partners. */
export function PartnerFields({ partners, invalid, onChange, onAdd }: PartnerFieldsProps) {
  const { t } = useTranslation('calculator')
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-xl font-semibold text-tcg-heading">{t('partners.legend')}</legend>
      <p className="text-sm">{t('partners.help')}</p>
      {partners.length === 0 && <p className="text-sm italic">{t('partners.empty')}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {partners.map((partner, index) => (
          <div key={partner.key} className="flex flex-col gap-1">
            <NumberField
              label={t('partners.partner', { number: index + 1 })}
              value={partner.volume}
              onChange={(volume) => onChange(partners.map((p) => (p.key === partner.key ? { ...p, volume } : p)))}
              error={invalid.includes(`partner-${index}`) ? t('invalid') : undefined}
            />
            <button
              type="button"
              className="self-start text-sm font-semibold text-tcg-primary underline"
              onClick={() => onChange(partners.filter((p) => p.key !== partner.key))}
            >
              {t('partners.remove', { number: index + 1 })}
            </button>
          </div>
        ))}
      </div>
      <Button className="self-start" onClick={onAdd}>
        {t('partners.add')}
      </Button>
    </fieldset>
  )
}
