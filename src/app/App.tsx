import { AppHeader, LanguageSelector, type LocalePreference } from '@anibelin007/tcg-ui'
import logo from '@anibelin007/tcg-ui/brand/tcg-logo-green.png'
import { useTranslation } from 'react-i18next'
import { CurrentCommissionPage } from '../features/current/CurrentCommissionPage'
import { NextLevelPage } from '../features/next-level/NextLevelPage'
import { TargetPage } from '../features/target/TargetPage'
import { SUPPORTED_LOCALES, isSupportedLocale, type Locale } from '../i18n/locales'
import { PartnerDataProvider } from '../state/PartnerDataProvider'
import { TabNav } from './TabNav'
import type { TabId } from './tabs'
import { useHashTab } from './use-hash-tab'

interface AppProps {
  /** Keeps the language choice in memory only (D-007). */
  localePreference: LocalePreference<Locale>
  /** Preselected market for a new session (D-016). */
  initialMarketId: string
  /** `sessionStorage` of the tab, where the real data is kept (D-007). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
}

const PAGES: Record<TabId, () => React.JSX.Element> = {
  commission: CurrentCommissionPage,
  'next-level': NextLevelPage,
  target: TargetPage,
}

/** Single-page app with three tabs sharing one copy of the real data (D-019). */
export function App({ localePreference, initialMarketId, storage }: AppProps) {
  const { t, i18n } = useTranslation()
  const [tab] = useHashTab()
  const current = isSupportedLocale(i18n.language) ? i18n.language : SUPPORTED_LOCALES[0]
  const Page = PAGES[tab]

  return (
    <PartnerDataProvider initialMarketId={initialMarketId} storage={storage}>
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
        <TabNav active={tab} />
        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-tcg-primary">{t('app.title')}</p>
            <h1 className="text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">{t(`nav.${tab}`)}</h1>
          </div>
          <Page />
          <p className="text-sm">{t('app.unofficial')}</p>
        </main>
      </div>
    </PartnerDataProvider>
  )
}
