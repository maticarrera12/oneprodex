import type { Match, MatchPoints } from "../types"
import { calcScorePts } from "@/features/predictions/utils/scoring"
import { MATCH_SCORING } from "@/features/scoring/constants"

export function calcPoints(match: Match): MatchPoints | null {
  if (match.status !== "FINISHED" || !match.pred || match.hs === null || match.as === null) return null

  const pts = calcScorePts(
    { home_score: match.pred.hs, away_score: match.pred.as },
    { home: match.hs, away: match.as },
  )

  const exact = pts === MATCH_SCORING.exactScore
  const winner = pts === MATCH_SCORING.correctResult

  return { exact, winner, pts }
}
