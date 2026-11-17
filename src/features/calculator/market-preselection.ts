import { MARKETS } from '../../domain/commission'

/** Market used when neither the browser nor the UI language indicates a known country. */
export const FALLBACK_MARKET_ID = 'ES'

function marketForRegion(tag: string): string | undefined {
  const region = tag.split('-')[1]?.toUpperCase()
  return region ? MARKETS.find((market) => market.country === region)?.id : undefined
}

/**
 * Preselects the market (D-016): the region of the first browser language that is a known
 * market (e.g. `pl-PL` → Poland, `de-AT` → Austria), otherwise the region of the UI locale
 * (e.g. `ca-ES` → Spain), otherwise Spain. The user can always change it; nothing is stored.
 * Where the factor depends on the contract type (France, Italy), the first contract listed is
 * preselected.
 */
export function preselectMarketId(browserLanguages: readonly string[], uiLocale: string): string {
  for (const tag of browserLanguages) {
    const id = marketForRegion(tag)
    if (id) return id
  }
  return marketForRegion(uiLocale) ?? FALLBACK_MARKET_ID
}
