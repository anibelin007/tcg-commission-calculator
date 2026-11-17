/** Returns a copy of `items` with the item at `index` moved by `delta` positions (clamped). */
export function moveItem<T>(items: readonly T[], index: number, delta: number): T[] {
  const target = Math.min(items.length - 1, Math.max(0, index + delta))
  if (target === index || index < 0 || index >= items.length) return [...items]
  const copy = [...items]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item!)
  return copy
}
