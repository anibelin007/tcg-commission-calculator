import { useTranslation } from 'react-i18next'

interface MoveButtonsProps {
  /** Name of the item, for the accessible labels. */
  name: string
  onUp?: () => void
  onDown?: () => void
}

/** ↑ ↓ buttons to reorder a list item; a missing handler disables that direction. */
export function MoveButtons({ name, onUp, onDown }: MoveButtonsProps) {
  const { t } = useTranslation('calculator')
  const button = 'rounded border border-tcg-border bg-white px-2 py-1 text-tcg-primary disabled:opacity-30'
  return (
    <div className="flex gap-1">
      <button type="button" className={button} onClick={onUp} disabled={!onUp} aria-label={t('legs.moveUp', { name })}>
        ↑
      </button>
      <button type="button" className={button} onClick={onDown} disabled={!onDown} aria-label={t('legs.moveDown', { name })}>
        ↓
      </button>
    </div>
  )
}
