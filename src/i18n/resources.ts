import type { TranslationTree } from '@anibelin007/tcg-ui'
import caES from './locales/ca-ES/common.json'
import deAT from './locales/de-AT/common.json'
import deDE from './locales/de-DE/common.json'
import enGB from './locales/en-GB/common.json'
import enUS from './locales/en-US/common.json'
import esES from './locales/es-ES/common.json'
import euES from './locales/eu-ES/common.json'
import type { Locale } from './locales'

/** Namespaces: `common` (shell texts). More are added with the calculator UI. */
export const NAMESPACES = ['common'] as const
export type Namespace = (typeof NAMESPACES)[number]
export const DEFAULT_NAMESPACE: Namespace = 'common'

export const resources: Readonly<Record<Locale, Record<Namespace, TranslationTree>>> = {
  'es-ES': { common: esES },
  'ca-ES': { common: caES },
  'eu-ES': { common: euES },
  'en-GB': { common: enGB },
  'en-US': { common: enUS },
  'de-DE': { common: deDE },
  'de-AT': { common: deAT },
}
