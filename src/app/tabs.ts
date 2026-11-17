/**
 * The three tabs of the single-page app (D-019). The active tab is reflected in the URL hash
 * so the browser's back/forward buttons move between tabs and a reload keeps the tab, with no
 * server configuration. IDs are stable and language-independent.
 */
export const TABS = ['commission', 'plan', 'target'] as const
export type TabId = (typeof TABS)[number]

export const DEFAULT_TAB: TabId = 'commission'

/** `#plan` → `plan`; anything unknown → the default tab. */
export function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#\/?/, '')
  return (TABS as readonly string[]).includes(id) ? (id as TabId) : DEFAULT_TAB
}

export function hashFor(tab: TabId): string {
  return `#${tab}`
}
