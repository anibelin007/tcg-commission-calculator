import { AppHeader, LanguageSelector, type LocalePreference } from '@anibelin007/tcg-ui'
import logo from '@anibelin007/tcg-ui/brand/tcg-logo-green.png'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES, isSupportedLocale, type Locale } from '../i18n/locales'

interface AppProps {
  /** Keeps the language choice in memory only: the app stores nothing (D-007). */
  localePreference: LocalePreference<Locale>
}

export function App({ localePreference }: AppProps) {
  const { t, i18n } = useTranslation()
  const current = isSupportedLocale(i18n.language) ? i18n.language : SUPPORTED_LOCALES[0]

  return (
    <div className="min-h-screen">
      <AppHeader logoSrc={logo} logoAlt={t('brand.logoAlt')}>
        <LanguageSelector
          label={t('languageSelector.label')}
          locales={SUPPORTED_LOCALES}
          value={current}
          onChange={(locale) => {
            localePreference.save(locale)
            void i18n.changeLanguage(locale)
          }}
        />
      </AppHeader>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">{t('app.title')}</h1>
        <p>{t('app.status')}</p>
        <p className="text-sm">{t('app.unofficial')}</p>
      </main>
    </div>
  )
}
