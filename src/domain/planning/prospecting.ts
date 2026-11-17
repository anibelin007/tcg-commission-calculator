/**
 * Business conversations («conversaciones de negocio», CN) a partner plans to have for each new
 * partner she wants in her team. Team statistic given by the PO (2026-11-17: «por estadística
 * tendremos que hacer 10 CN»), not a RINGANA rule. Provisional decision D-024.
 */
export const BUSINESS_CONVERSATIONS_PER_PARTNER = 10

/**
 * Latest month a new partner can join to count in `planned`: the month before (BR-23: a partner
 * who joins in M counts for her upline from M+1, with her points of M and M+1).
 */
export function latestJoiningMonth(planned: { year: number; month: number }): { year: number; month: number } {
  return planned.month === 1 ? { year: planned.year - 1, month: 12 } : { year: planned.year, month: planned.month - 1 }
}

/** Business conversations to plan for `newPartners` new partners (never negative). */
export function businessConversationsFor(newPartners: number): number {
  return Math.max(0, Math.ceil(newPartners)) * BUSINESS_CONVERSATIONS_PER_PARTNER
}
