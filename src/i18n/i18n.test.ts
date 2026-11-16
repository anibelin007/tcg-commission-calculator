import { describe, expect, it } from 'vitest'
import { createAppI18n } from '.'
import { BASE_LOCALES, REFERENCE_LOCALE, SUPPORTED_LOCALES } from './locales'
import { NAMESPACES, resources, type Namespace } from './resources'
import type { TranslationTree } from '@anibelin007/tcg-ui'

function keys(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  )
}

describe('translations', () => {
  const reference = (namespace: Namespace) => keys(resources[REFERENCE_LOCALE][namespace]).sort()

  it.each(BASE_LOCALES.flatMap((locale) => NAMESPACES.map((namespace) => [locale, namespace] as const)))(
    '%s/%s has exactly the keys of es-ES',
    (locale, namespace) => {
      expect(keys(resources[locale][namespace]).sort()).toEqual(reference(namespace))
    },
  )

  it.each(SUPPORTED_LOCALES.filter((locale) => !BASE_LOCALES.includes(locale)))(
    '%s only overrides existing keys',
    (locale) => {
      for (const namespace of NAMESPACES) {
        for (const key of keys(resources[locale][namespace])) expect(reference(namespace)).toContain(key)
      }
    },
  )

  it.each(SUPPORTED_LOCALES)('%s resolves every key', async (locale) => {
    const i18n = await createAppI18n(locale)
    for (const key of reference('common')) expect(i18n.t(key)).not.toBe(key)
  })
})
