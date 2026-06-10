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
}

export function derivePredictionFlow({
  matchStatus,
  hasScore,
  editLocked,
}: PredictionFlowInput): PredictionFlow {
  const matchLocked = matchStatus !== "UPCOMING"

  return {
    scoreLocked: matchLocked || hasScore,
    extrasVisible: hasScore && !matchLocked,
    extrasLocked: matchLocked || editLocked,
  }
}
