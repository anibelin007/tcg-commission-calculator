import { useTranslation } from 'react-i18next'
import { TABS, hashFor, type TabId } from './tabs'

interface TabNavProps {
  active: TabId
}

/** Three tabs, full width on mobile. Plain links to `#…`, so they work without JavaScript routing. */
export function TabNav({ active }: TabNavProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('nav.label')} className="sticky top-0 z-10 border-b border-tcg-surface-strong bg-white">
      <ul className="mx-auto grid max-w-3xl grid-cols-3">
        {TABS.map((tab) => (
          <li key={tab}>
            <a
              href={hashFor(tab)}
              aria-current={tab === active ? 'page' : undefined}
              className="block px-2 py-3 text-center text-sm font-semibold leading-tight text-tcg-body hover:bg-tcg-surface aria-[current=page]:border-b-4 aria-[current=page]:border-tcg-primary aria-[current=page]:text-tcg-primary sm:text-base"
            >
              {t(`nav.${tab}`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
