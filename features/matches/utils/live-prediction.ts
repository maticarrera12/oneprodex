type Score = { hs: number; as: number }

function pickWinner({ hs, as }: Score): "home" | "away" | "draw" {
  if (hs > as) return "home"
  if (as > hs) return "away"
  return "draw"
}

export function isLivePredictionOnTrack(
  prediction: Score | null | undefined,
  current: { hs: number | null; as: number | null },
): boolean {
  if (!prediction || current.hs === null || current.as === null) return false

  return pickWinner(prediction) === pickWinner({ hs: current.hs, as: current.as })
}

export function isLivePredictionExact(
  prediction: Score | null | undefined,
  current: { hs: number | null; as: number | null },
): boolean {
  if (!prediction || current.hs === null || current.as === null) return false
  return prediction.hs === current.hs && prediction.as === current.as
}
