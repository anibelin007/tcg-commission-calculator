/** Removes floating-point noise from point values (e.g. 128.00000000000003 → 128). */
export function cleanPoints(value: number): number {
  return Math.round(value * 1e6) / 1e6
}

/**
 * Rounds an amount to the currency's minor unit, half away from zero. Provisional: no
 * intermediate rounding, two decimals for every currency (BR-17, Q-05).
 */
export function roundAmount(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}
