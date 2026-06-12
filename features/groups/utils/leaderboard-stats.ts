export type MemberLeaderboardStats = {
  acc: number
  streak: number
}

type ScoredPrediction = {
  points: number | null
  created_at: string
}

type ScoredBracketPick = {
  points: number | null
}

export function computeMemberLeaderboardStats(
  predictions: ScoredPrediction[],
  bracketPicks: ScoredBracketPick[],
): MemberLeaderboardStats {
  const orderedPredictions = [...predictions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const scoredPredictions = orderedPredictions.filter((row) => row.points !== null)
  const predictionHits = scoredPredictions.filter((row) => (row.points ?? 0) > 0).length

  const scoredBracket = bracketPicks.filter((row) => row.points !== null)
  const bracketHits = scoredBracket.filter((row) => (row.points ?? 0) > 0).length

  const scoredTotal = scoredPredictions.length + scoredBracket.length
  const hitsTotal = predictionHits + bracketHits
  const acc = scoredTotal > 0 ? Math.round((hitsTotal / scoredTotal) * 100) : 0

  let streak = 0
  for (const row of scoredPredictions) {
    if ((row.points ?? 0) > 0) streak++
    else break
  }

  return { acc, streak }
}
