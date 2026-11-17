import { initialLocale, memoryLocalePreference, resolveLocale, syncDocumentLanguage } from '@anibelin007/tcg-ui'
import favicon from '@anibelin007/tcg-ui/brand/tcg-favicon.png'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { App } from './app/App'
import { preselectMarketId } from './features/calculator/market-preselection'
import { createAppI18n } from './i18n'
import { REFERENCE_LOCALE, SUPPORTED_LOCALES, type Locale } from './i18n/locales'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

const icon = document.createElement('link')
icon.rel = 'icon'
icon.href = favicon
document.head.append(icon)

// No persistence (D-007): the language choice lives only while the page is open.
const localePreference = memoryLocalePreference<Locale>()
const i18n = await createAppI18n(initialLocale(localePreference.read(), navigator.languages, SUPPORTED_LOCALES, REFERENCE_LOCALE))
syncDocumentLanguage(i18n)
const updateTitle = () => {
  document.title = i18n.t('app.title')
}
updateTitle()
i18n.on('languageChanged', updateTitle)
// Follow changes of the browser language settings, unless the user chose a language.
window.addEventListener('languagechange', () => {
  if (localePreference.read()) return
  void i18n.changeLanguage(resolveLocale(navigator.languages, SUPPORTED_LOCALES, REFERENCE_LOCALE))
})

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App localePreference={localePreference} initialMarketId={preselectMarketId(navigator.languages, i18n.language)} />
    </I18nextProvider>
  </StrictMode>,
)
