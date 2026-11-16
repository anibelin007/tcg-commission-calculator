import { createI18n } from '@anibelin007/tcg-ui'
import { LOCALE_FALLBACKS, REFERENCE_LOCALE, SUPPORTED_LOCALES, type Locale } from './locales'
import { DEFAULT_NAMESPACE, NAMESPACES, resources } from './resources'

/** Creates the app's i18next instance (also used by tests). */
export function createAppI18n(locale: Locale = REFERENCE_LOCALE) {
  return createI18n({
    locale,
    supportedLocales: SUPPORTED_LOCALES,
    fallbacks: LOCALE_FALLBACKS,
    resources,
    namespaces: NAMESPACES,
    defaultNamespace: DEFAULT_NAMESPACE,
  })
}
