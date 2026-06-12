import type { MatchInfo, MatchPrediction } from "@/features/onboarding/utils/group-standings"

export type MatchWithStatus = MatchInfo & {
  status: string
  home_score: number | null
  away_score: number | null
}

/**
 * Pure helper that fills prediction gaps with real match results.
 *
 * Rules:
 * - Only fills gaps (matches with no user prediction row).
 * - Only fills when status === 'FINISHED' AND both home_score and away_score are not null.
 * - LIVE and UPCOMING matches are NEVER filled.
 * - Existing user predictions are NEVER overridden.
 * - Does not mutate inputs; returns a new array.
 */
export function mergeWithRealResults(
  userPredictions: MatchPrediction[],
  allMatches: MatchWithStatus[]
): MatchPrediction[] {
  const predictedMatchIds = new Set<string>(userPredictions.map((p) => p.match_id))

  const gapFills: MatchPrediction[] = []
  for (const match of allMatches) {
    if (predictedMatchIds.has(match.id)) continue
    if (match.status !== "FINISHED") continue
    if (match.home_score === null || match.away_score === null) continue

    gapFills.push({
      match_id: match.id,
      home_score: match.home_score,
      away_score: match.away_score,
    })
  }

  return [...userPredictions, ...gapFills]
}
