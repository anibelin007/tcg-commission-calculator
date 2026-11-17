import { isOneOf } from '@anibelin007/tcg-ui'

/** UI languages (D-015). es-ES is the reference. Market and language are independent (D-006). */
export const SUPPORTED_LOCALES = ['es-ES', 'ca-ES', 'eu-ES', 'en-GB', 'en-US', 'de-DE', 'de-AT'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const REFERENCE_LOCALE: Locale = 'es-ES'

/** Regional variants only override their base locale; base locales have no fallback. */
export const LOCALE_FALLBACKS: Readonly<Record<Locale, readonly Locale[]>> = {
  'es-ES': [],
  'ca-ES': [],
  'eu-ES': [],
  'en-GB': [],
  'en-US': ['en-GB'],
  'de-DE': [],
  'de-AT': ['de-DE'],
}

export const BASE_LOCALES: readonly Locale[] = SUPPORTED_LOCALES.filter((locale) => LOCALE_FALLBACKS[locale].length === 0)

export function isSupportedLocale(value: unknown): value is Locale {
  return isOneOf(value, SUPPORTED_LOCALES)
}
