import { TARGET_LEVELS, levelDefinition, type Plan, type QualificationPath, type TargetLevel } from './plans'
import { ownMeasureValue, teamMeasureValue, type Volumes } from './volumes'

function meets(path: QualificationPath, volumes: Volumes): boolean {
  if (ownMeasureValue(volumes, path.own.measure) < path.own.min) return false
  return !path.team || teamMeasureValue(volumes, path.team.measure) >= path.team.min
}

export function qualifiesFor(plan: Plan, level: TargetLevel, volumes: Volumes): boolean {
  return levelDefinition(plan, level).qualification.some((path) => meets(path, volumes))
}

/** Highest level whose criteria are met (BR-08), or null below level 1 (no commission, BR-09). */
export function attainedLevel(plan: Plan, volumes: Volumes): TargetLevel | null {
  for (const level of [...TARGET_LEVELS].reverse()) {
    if (qualifiesFor(plan, level, volumes)) return level
  }
  return null
}
