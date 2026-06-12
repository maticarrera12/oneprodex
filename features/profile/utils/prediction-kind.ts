import type { ProfileHistoryKind } from "@/features/profile/types"

export function computePredictionKind(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): ProfileHistoryKind {
  const predictedWinner =
    predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw"
  const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw"
  const exactScore = predictedHome === actualHome && predictedAway === actualAway
  return exactScore ? "exact" : predictedWinner === actualWinner ? "result" : "miss"
}
