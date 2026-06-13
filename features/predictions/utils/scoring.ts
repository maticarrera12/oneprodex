import { MATCH_SCORING, UPSET_BONUS } from "@/features/scoring/constants"

export function calcScorePts(
  pred: { home_score: number; away_score: number },
  result: { home: number | null; away: number | null },
): number {
  if (result.home === null || result.away === null) return 0

  if (pred.home_score === result.home && pred.away_score === result.away) {
    return MATCH_SCORING.exactScore
  }

  const predWinner = Math.sign(pred.home_score - pred.away_score)
  const actualWinner = Math.sign(result.home - result.away)
  if (predWinner === actualWinner) return MATCH_SCORING.correctResult

  return 0
}

export function calcPlayerScorerPts(predictedApiIds: number[], goalScorerApiIds: number[]): number {
  const scorerSet = new Set(goalScorerApiIds)
  const correct = predictedApiIds.filter((id) => scorerSet.has(id)).length
  return correct * MATCH_SCORING.scorer
}

export function calcCardPts(
  predictedYellowIds: number[],
  predictedRedIds: number[],
  yellowCardedIds: number[],
  redCardedIds: number[],
): number {
  const yellowSet = new Set(yellowCardedIds)
  const redSet = new Set(redCardedIds)
  const correctYellow = predictedYellowIds.filter((id) => yellowSet.has(id)).length
  const correctRed = predictedRedIds.filter((id) => redSet.has(id)).length
  return correctYellow * MATCH_SCORING.yellowCard + correctRed * MATCH_SCORING.redCard
}

/**
 * Compute the upset bonus points for a winning underdog.
 * Pure function — no eligibility logic. Eligibility (gap >= 15, underdog won,
 * user predicted winner, not a draw, snapshot exists) lives in scoreMatch().
 *
 * Formula: clamp(round(25 * (1 - winnerImpliedPct / 100)), UPSET_BONUS.min, UPSET_BONUS.max)
 */
export function calcUpsetBonus(winnerImpliedPct: number): number {
  const raw = Math.round(UPSET_BONUS.max * (1 - winnerImpliedPct / 100))
  return Math.max(UPSET_BONUS.min, Math.min(UPSET_BONUS.max, raw))
}

/**
 * homeScore / awayScore represent goals conceded by each team
 * (i.e. homeScore = goals against home = away team's scored goals in the match row,
 *  awayScore = goals against away = home team's scored goals in the match row).
 * Pass match.away_score as homeScore and match.home_score as awayScore.
 */
export function calcCleanSheetPts(
  predictedTeamCodes: string[],
  homeTeamCode: string,
  awayTeamCode: string,
  homeScore: number | null,
  awayScore: number | null,
): number {
  if (homeScore === null || awayScore === null) return 0

  let pts = 0

  if (predictedTeamCodes.includes(homeTeamCode) && homeScore === 0) {
    pts += MATCH_SCORING.cleanSheet
  }

  if (predictedTeamCodes.includes(awayTeamCode) && awayScore === 0) {
    pts += MATCH_SCORING.cleanSheet
  }

  return pts
}
