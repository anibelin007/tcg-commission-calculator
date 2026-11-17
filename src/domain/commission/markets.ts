import type { PlanId } from './plans'

/**
 * Markets offered by the calculator: the 35 countries of the RINGANA countries service (S-12)
 * with a known plan and points factor. See docs/sources/ringana-countries.md and BR-14, BR-16.
 * Country and contract names are not stored here: the UI translates them (country names via
 * `Intl.DisplayNames`, contract types via i18n keys).
 */

export type CurrencyCode = 'EUR' | 'CHF' | 'SEK' | 'DKK' | 'GBP' | 'PLN' | 'CZK' | 'HUF' | 'MXN' | 'PEN' | 'COP' | 'ARS' | 'USD'

/** Contract types with their own points factor (EU-ES p. 13). */
export type ContractType = 'vdi' | 'mandataire' | 'occasionale' | 'partitaIva'

export interface Market {
  /** Stable ID: ISO country code, plus the contract type where the factor depends on it. */
  readonly id: string
  /** ISO 3166-1 alpha-2 code as used by RINGANA (`IC` = Canary Islands). */
  readonly country: string
  readonly contract?: ContractType
  readonly plan: PlanId
  readonly currency: CurrencyCode
  /** Value of one commission point in the local currency (BR-14). */
  readonly pointsFactor: number
  /** Commissions above this amount are transferred; otherwise paid as a voucher (BR-16). Null: unknown (Q-04). */
  readonly payoutThreshold: number | null
  /** Billing addresses with an additional settlement document for tax reasons (BR-15). */
  readonly taxSpecificSettlement: boolean
}

const EUR_STANDARD = ['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'IC', 'FI', 'GR', 'HR', 'IE', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'RO', 'SI', 'SK'] as const

function euro(country: string, pointsFactor = 1.32, contract?: ContractType): Market {
  return {
    id: contract ? `${country}-${contract}` : country,
    country,
    ...(contract ? { contract } : {}),
    plan: 'eu',
    currency: 'EUR',
    pointsFactor,
    payoutThreshold: 65,
    taxSpecificSettlement: country === 'FR' || country === 'IT',
  }
}

function local(country: string, currency: CurrencyCode, pointsFactor: number): Market {
  return { id: country, country, plan: 'eu', currency, pointsFactor, payoutThreshold: null, taxSpecificSettlement: country === 'CH' }
}

export const MARKETS: readonly Market[] = [
  ...EUR_STANDARD.map((country) => euro(country)),
  euro('FR', 1.216, 'vdi'),
  euro('FR', 1.32, 'mandataire'),
  euro('IT', 1.32, 'occasionale'),
  euro('IT', 1.251, 'partitaIva'),
  local('CH', 'CHF', 1.2),
  local('SE', 'SEK', 14.72),
  local('DK', 'DKK', 9.65),
  local('GB', 'GBP', 1.107),
  local('PL', 'PLN', 5.59),
  local('CZ', 'CZK', 32.5),
  local('HU', 'HUF', 540),
  { id: 'MX', country: 'MX', plan: 'mx', currency: 'MXN', pointsFactor: 26, payoutThreshold: 1700, taxSpecificSettlement: true },
  // No small-commission (voucher) threshold in the Peru, Colombia and Argentina guidelines.
  { id: 'PE', country: 'PE', plan: 'pe', currency: 'PEN', pointsFactor: 5.2, payoutThreshold: null, taxSpecificSettlement: true },
  { id: 'CO', country: 'CO', plan: 'co', currency: 'COP', pointsFactor: 6240, payoutThreshold: null, taxSpecificSettlement: true },
  { id: 'AR', country: 'AR', plan: 'ar', currency: 'ARS', pointsFactor: 2210, payoutThreshold: null, taxSpecificSettlement: true },
  { id: 'US', country: 'US', plan: 'usa', currency: 'USD', pointsFactor: 1.6, payoutThreshold: 65, taxSpecificSettlement: false },
]

export function findMarket(id: string): Market | undefined {
  return MARKETS.find((market) => market.id === id)
}
