import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { MARKETS, findMarket } from '../../domain/commission'
import { countryName } from './format'

interface MarketFieldsProps {
  marketId: string
  onChange: (marketId: string) => void
}

const selectClass =
  'rounded border border-tcg-border bg-white px-4 py-3 text-tcg-input-text shadow-xs focus:border-tcg-primary focus:outline-2 focus:outline-tcg-primary/30'

/** Billing country, plus the contract type where the points factor depends on it (France, Italy). */
export function MarketFields({ marketId, onChange }: MarketFieldsProps) {
  const { t, i18n } = useTranslation('calculator')
  const countryId = useId()
  const contractId = useId()
  const market = findMarket(marketId)
  const countries = [...new Set(MARKETS.map((candidate) => candidate.country))]
    .map((country) => ({ country, name: countryName(i18n.language, country) }))
    .sort((a, b) => a.name.localeCompare(b.name, i18n.language))
  const contracts = MARKETS.filter((candidate) => candidate.country === market?.country && candidate.contract)

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-xl font-semibold text-tcg-heading">{t('market.legend')}</legend>
      <div className="flex flex-col gap-1">
        <label htmlFor={countryId} className="text-sm font-semibold text-tcg-heading">
          {t('market.country')}
        </label>
        <select
          id={countryId}
          className={selectClass}
          value={market?.country ?? ''}
          onChange={(event) => {
            const first = MARKETS.find((candidate) => candidate.country === event.target.value)
            if (first) onChange(first.id)
          }}
        >
          {countries.map(({ country, name }) => (
            <option key={country} value={country}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {contracts.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor={contractId} className="text-sm font-semibold text-tcg-heading">
            {t('market.contract')}
          </label>
          <select id={contractId} className={selectClass} value={marketId} onChange={(event) => onChange(event.target.value)}>
            {contracts.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {t(`market.contracts.${candidate.contract}`)}
              </option>
            ))}
          </select>
        </div>
      )}
    </fieldset>
  )
}
