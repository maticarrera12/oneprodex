import type { MatchStatus } from "@/features/matches/types"

type PredictionFlowInput = {
  matchStatus: MatchStatus
  hasScore: boolean
  editLocked: boolean
}

type PredictionFlow = {
  scoreLocked: boolean
  extrasVisible: boolean
  extrasLocked: boolean
  extrasReady: boolean
}

export function derivePredictionFlow({
  matchStatus,
  hasScore,
  editLocked,
}: PredictionFlowInput): PredictionFlow {
  const matchLocked = matchStatus !== "UPCOMING"

  return {
    scoreLocked: matchLocked || hasScore,
    extrasVisible: !matchLocked,
    extrasLocked: matchLocked || editLocked,
    extrasReady: hasScore,
  }
}

export function canPickScorerForTeam({
  teamSide,
  homeScore,
  awayScore,
}: {
  teamSide: "home" | "away"
  homeScore: number
  awayScore: number
}): boolean {
  return teamSide === "home" ? homeScore > 0 : awayScore > 0
}
