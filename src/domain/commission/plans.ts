/**
 * Target plans as data (business rules BR-07, BR-10 to BR-12, BR-18 in
 * docs/functional/business-rules.md). Each plan cites the guideline it comes from.
 */

export type PlanId = 'eu' | 'mx' | 'usa'

export const TARGET_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type TargetLevel = (typeof TARGET_LEVELS)[number]

/**
 * Own volume measures:
 * - `ct`: customer turnover. In the EU and MX plans it includes the partner's own orders (BR-04).
 * - `dt`: direct turnover = CT + personal turnover (USA plan only, BR-18).
 */
export type OwnMeasure = 'ct' | 'dt'

/** Team volume measures: TT and TT minus the 1, 2 or 3 strongest teams (BR-05, BR-06). */
export type TeamMeasure = 'tt' | 'tt1' | 'tt2' | 'tt3'

/** One way to qualify for a level: an own-volume minimum, optionally with a team minimum. */
export interface QualificationPath {
  readonly own: { readonly measure: OwnMeasure; readonly min: number }
  readonly team?: { readonly measure: TeamMeasure; readonly min: number }
}

export interface LevelDefinition {
  readonly level: TargetLevel
  /** Commission rate on the own volume (fraction, e.g. 0.39). */
  readonly ownRate: number
  /** Commission rates by generation (index 0 = generation 1). Missing generations earn nothing. */
  readonly generationRates: readonly number[]
  /** Limit for the strongest team (BR-12), or null when there is none. */
  readonly strongestTeamLimit: number | null
  /** The level is reached when any path is met (BR-07). */
  readonly qualification: readonly QualificationPath[]
}

export interface Plan {
  readonly id: PlanId
  /** Guideline the data comes from. */
  readonly source: string
  /** Own volume used for TT and for the own commission. */
  readonly ownMeasure: OwnMeasure
  readonly levels: readonly LevelDefinition[]
}

// Shared by all plans: rates, generations and limits are identical in EU, MX and USA.
const OWN_RATE: Record<TargetLevel, number> = { 1: 0.19, 2: 0.29, 3: 0.39, 4: 0.39, 5: 0.39, 6: 0.39, 7: 0.39, 8: 0.39, 9: 0.39, 10: 0.39 }

const L6_PLUS = [0.09, 0.14, 0.06, 0.04, 0.02, 0.02, 0.01, 0.01, 0.01] as const
const GENERATION_RATES: Record<TargetLevel, readonly number[]> = {
  1: [0.08, 0.02],
  2: [0.08, 0.04, 0.03],
  3: [0.08, 0.09, 0.04, 0.02],
  4: [0.09, 0.14, 0.05, 0.03, 0.02],
  5: [0.09, 0.14, 0.06, 0.04, 0.02, 0.01],
  6: L6_PLUS,
  7: L6_PLUS,
  8: L6_PLUS,
  9: L6_PLUS,
  10: L6_PLUS,
}

const LIMITS: Record<TargetLevel, number | null> = { 1: 500, 2: 1000, 3: 1500, 4: 2000, 5: 3000, 6: 4500, 7: 7000, 8: null, 9: null, 10: null }

/** Team minima of levels 4–10, common to all plans. */
const TEAM_MINIMA: Partial<Record<TargetLevel, { measure: TeamMeasure; min: number }>> = {
  4: { measure: 'tt1', min: 3200 },
  5: { measure: 'tt2', min: 4000 },
  6: { measure: 'tt2', min: 8000 },
  7: { measure: 'tt2', min: 15000 },
  8: { measure: 'tt3', min: 20000 },
  9: { measure: 'tt3', min: 40000 },
  10: { measure: 'tt3', min: 60000 },
}

function levels(qualification: (level: TargetLevel) => readonly QualificationPath[]): LevelDefinition[] {
  return TARGET_LEVELS.map((level) => ({
    level,
    ownRate: OWN_RATE[level],
    generationRates: GENERATION_RATES[level],
    strongestTeamLimit: LIMITS[level],
    qualification: qualification(level),
  }))
}

/** Levels 1–3 qualify on the own volume `measure` (CT in EU/MX, DT in USA). */
function lowLevels(level: TargetLevel, measure: OwnMeasure): readonly QualificationPath[] | null {
  switch (level) {
    case 1:
      return [{ own: { measure, min: 110 } }]
    case 2:
      return [{ own: { measure, min: 220 }, team: { measure: 'tt', min: 1000 } }, { own: { measure, min: 385 } }]
    case 3:
      return [{ own: { measure, min: 330 }, team: { measure: 'tt1', min: 1600 } }, { own: { measure, min: 825 } }]
    default:
      return null
  }
}

/** EU-ES p. 5–6: CT minimum 440 / 550 / 660 for levels 4 / 5 / 6–10. */
const EU_CT_MIN: Partial<Record<TargetLevel, number>> = { 4: 440, 5: 550, 6: 660, 7: 660, 8: 660, 9: 660, 10: 660 }

function euQualification(level: TargetLevel): readonly QualificationPath[] {
  return lowLevels(level, 'ct') ?? [{ own: { measure: 'ct', min: EU_CT_MIN[level]! }, team: TEAM_MINIMA[level]! }]
}

/** USA p. 5–6: levels 1–3 on DT; levels 4–10 need CT ≥ 330 plus the team minimum. */
function usaQualification(level: TargetLevel): readonly QualificationPath[] {
  return lowLevels(level, 'dt') ?? [{ own: { measure: 'ct', min: 330 }, team: TEAM_MINIMA[level]! }]
}

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  eu: { id: 'eu', source: 'RCG EU 3.4 (ES) / 2.5, 06/2026', ownMeasure: 'ct', levels: levels(euQualification) },
  mx: { id: 'mx', source: 'RCG MX 2.4, 06/2026', ownMeasure: 'ct', levels: levels(euQualification) },
  usa: { id: 'usa', source: 'RCG USA 1.0, 10/2026', ownMeasure: 'dt', levels: levels(usaQualification) },
}

export function levelDefinition(plan: Plan, level: TargetLevel): LevelDefinition {
  const definition = plan.levels.find((candidate) => candidate.level === level)
  if (!definition) throw new Error(`Level ${level} missing in plan ${plan.id}`)
  return definition
}
