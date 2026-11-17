/**
 * How extra team points are split between legs (D-021, design §5). Every strategy gives each
 * leg an amount that never decreases when the total grows, so the commission never decreases
 * either and a binary search on the total is valid.
 */
export const ALLOCATION_STRATEGIES = ['levelling', 'proportional', 'equal'] as const
export type AllocationStrategy = (typeof ALLOCATION_STRATEGIES)[number]

/** Ideal (unrounded) split of `total` between legs with the given volumes. */
function idealSplit(strategy: AllocationStrategy, volumes: readonly number[], total: number): number[] {
  const count = volumes.length
  if (count === 0) return []
  const equal = () => volumes.map(() => total / count)
  switch (strategy) {
    case 'equal':
      return equal()
    case 'proportional': {
      const sum = volumes.reduce((a, b) => a + b, 0)
      return sum > 0 ? volumes.map((volume) => (total * volume) / sum) : equal()
    }
    case 'levelling': {
      // Water-filling: raise the weakest legs to a common level L with Σ max(0, L − vᵢ) = total.
      // Legs below L reach it together; stronger legs get nothing until everyone is level.
      const sorted = [...volumes].sort((a, b) => a - b)
      let level = sorted[0]!
      let remaining = total
      for (let i = 0; i < count; i++) {
        const next = i + 1 < count ? sorted[i + 1]! : Infinity
        const needed = (next - level) * (i + 1)
        if (needed >= remaining) {
          level += remaining / (i + 1)
          remaining = 0
          break
        }
        remaining -= needed
        level = next
      }
      return volumes.map((volume) => Math.max(0, level - volume))
    }
  }
}

/**
 * Split `total` points (two decimals) between legs. Works in hundredths of a point; the
 * rounding remainder goes to the legs with the largest fractions (ties: lower index), so the
 * parts always add up exactly to `total`.
 */
export function allocate(strategy: AllocationStrategy, volumes: readonly number[], total: number): number[] {
  const hundredths = Math.round(total * 100)
  // Same unit everywhere: volumes and total in hundredths of a point.
  const ideal = idealSplit(strategy, volumes.map((volume) => Math.round(volume * 100)), hundredths)
  const floors = ideal.map((value) => Math.floor(value + 1e-9))
  let rest = hundredths - floors.reduce((a, b) => a + b, 0)
  const order = ideal.map((value, index) => ({ index, fraction: value - floors[index]! })).sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of order) {
    if (rest <= 0) break
    floors[index] = floors[index]! + 1
    rest--
  }
  return floors.map((value) => value / 100)
}
