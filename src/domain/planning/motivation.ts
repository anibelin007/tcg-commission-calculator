import type { TargetLevel } from '../commission'

/** Message ID per reached level, from the team planner sheet (texts in i18n, PO 2026-11-17). */
export function motivationKey(level: TargetLevel | null): `level${TargetLevel}` | null {
  return level === null ? null : `level${level}`
}
