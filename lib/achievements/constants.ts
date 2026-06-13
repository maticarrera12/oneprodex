// All achievements are enabled. juega_david was unblocked in Slice 2 once
// match_predictions is populated with odds-derived data (PR #8).
export const DISABLED_ACHIEVEMENT_IDS = new Set<string>([])

export function isAchievementEnabled(achievementId: string): boolean {
  return !DISABLED_ACHIEVEMENT_IDS.has(achievementId)
}
