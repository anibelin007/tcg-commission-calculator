import type { TranslationTree } from '@anibelin007/tcg-ui'
import caES from './locales/ca-ES/common.json'
import caESCalculator from './locales/ca-ES/calculator.json'
import deAT from './locales/de-AT/common.json'
import deATCalculator from './locales/de-AT/calculator.json'
import deDE from './locales/de-DE/common.json'
import deDECalculator from './locales/de-DE/calculator.json'
import enGB from './locales/en-GB/common.json'
import enGBCalculator from './locales/en-GB/calculator.json'
import enUS from './locales/en-US/common.json'
import enUSCalculator from './locales/en-US/calculator.json'
import esES from './locales/es-ES/common.json'
import esESCalculator from './locales/es-ES/calculator.json'
import euES from './locales/eu-ES/common.json'
import euESCalculator from './locales/eu-ES/calculator.json'
import type { Locale } from './locales'

/** Namespaces: `common` (shell texts) and `calculator` (form and result). */
export const NAMESPACES = ['common', 'calculator'] as const
export type Namespace = (typeof NAMESPACES)[number]
export const DEFAULT_NAMESPACE: Namespace = 'common'

export const resources: Readonly<Record<Locale, Record<Namespace, TranslationTree>>> = {
  'es-ES': { common: esES, calculator: esESCalculator },
  'ca-ES': { common: caES, calculator: caESCalculator },
  'eu-ES': { common: euES, calculator: euESCalculator },
  'en-GB': { common: enGB, calculator: enGBCalculator },
  'en-US': { common: enUS, calculator: enUSCalculator },
  'de-DE': { common: deDE, calculator: deDECalculator },
  'de-AT': { common: deAT, calculator: deATCalculator },
}
