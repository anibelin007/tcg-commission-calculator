import { useCallback, useEffect, useState } from 'react'
import { hashFor, tabFromHash, type TabId } from './tabs'

/**
 * Active tab synced with `location.hash`. Changing tab adds a history entry, so «back» returns
 * to the previous tab instead of leaving the app.
 */
export function useHashTab(): [TabId, (tab: TabId) => void] {
  const [tab, setTab] = useState<TabId>(() => tabFromHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setTab(tabFromHash(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: TabId) => {
    if (tabFromHash(window.location.hash) !== next) window.location.hash = hashFor(next)
  }, [])

  return [tab, navigate]
}
