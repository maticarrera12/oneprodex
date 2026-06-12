/**
 * Pure gate function: returns true only when the user is in prode mode and
 * group rankings should be re-derived on page load.
 *
 * Quick-mode users have hand-picked group_picks (from the manual bracket UI) —
 * calling deriveAndPersistGroupRankings for them would overwrite their picks.
 */
export function shouldReDeriveGroupRankings(user: {
  onboarding_mode: string | null
}): boolean {
  return user.onboarding_mode === "prode"
}
