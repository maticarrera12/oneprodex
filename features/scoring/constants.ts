export const MATCH_SCORING = {
  exactScore: 50,
  correctResult: 24,
  scorer: 16,
  yellowCard: 8,
  redCard: 16,
  cleanSheet: 12,
} as const

export const BRACKET_SCORING = {
  R32: 20,
  R16: 40,
  QF: 70,
  SF: 100,
  THIRD: 80,
  FINAL: 160,
} as const

// MATCHUP HIT — bonus for predicting the exact knockout pairing (set of two
// teams) at a slot, independent of the winner pick. Applies from R16 onward;
// R32 pairings derive from group picks (not bracket picks) and THIRD is omitted.
export const MATCHUP_HIT_SCORING = {
  R16: 20,
  QF: 35,
  SF: 50,
  FINAL: 80,
} as const

export const UPSET_BONUS = {
  min: 8,
  max: 25,
} as const

export const UPSET_ELIGIBILITY_GAP = 15

export const MATCH_SCORING_LABELS = {
  exactScore: `Resultado exacto · ${MATCH_SCORING.exactScore} pts`,
  correctResult: `Solo resultado · ${MATCH_SCORING.correctResult} pts`,
  prodeHint: `Resultado exacto = ${MATCH_SCORING.exactScore} pts · Solo ganador/empate = ${MATCH_SCORING.correctResult} pts`,
  cleanSheet: `Arco en 0 · +${MATCH_SCORING.cleanSheet} pts`,
} as const
