export const DISABLED_ACHIEVEMENT_IDS = new Set<string>([
  // Blocked until API-Football match_predictions snapshots are reliable.
  "juega_david",
])

export function isAchievementEnabled(achievementId: string): boolean {
  return !DISABLED_ACHIEVEMENT_IDS.has(achievementId)
}
