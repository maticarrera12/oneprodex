export type ConsensusScoreInput = {
  homeScore: number
  awayScore: number
}

export type ConsensusSummary = {
  count: number
  topScore: string | null
  topScoreCount: number
}

export type OutcomeSplit = {
  homePct: number
  drawPct: number
  awayPct: number
  homeCount: number
  drawCount: number
  awayCount: number
}

export type ScoreDistributionEntry = {
  score: string
  count: number
  pct: number
}

export function summarizeConsensusPredictions(predictions: ConsensusScoreInput[]): ConsensusSummary {
  if (predictions.length === 0) {
    return { count: 0, topScore: null, topScoreCount: 0 }
  }

  const counts = new Map<string, number>()
  for (const prediction of predictions) {
    const key = `${prediction.homeScore}-${prediction.awayScore}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const [topScore, topScoreCount] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]!
  return { count: predictions.length, topScore, topScoreCount }
}

export function computeOutcomeSplit(predictions: ConsensusScoreInput[]): OutcomeSplit {
  if (predictions.length === 0) {
    return { homePct: 0, drawPct: 0, awayPct: 0, homeCount: 0, drawCount: 0, awayCount: 0 }
  }

  let homeCount = 0
  let drawCount = 0
  let awayCount = 0

  for (const prediction of predictions) {
    if (prediction.homeScore > prediction.awayScore) homeCount++
    else if (prediction.homeScore === prediction.awayScore) drawCount++
    else awayCount++
  }

  const total = predictions.length
  return {
    homePct: Math.round((homeCount / total) * 100),
    drawPct: Math.round((drawCount / total) * 100),
    awayPct: Math.round((awayCount / total) * 100),
    homeCount,
    drawCount,
    awayCount,
  }
}

export function computeScoreDistribution(
  predictions: ConsensusScoreInput[],
  limit = 4,
): ScoreDistributionEntry[] {
  if (predictions.length === 0) return []

  const counts = new Map<string, number>()
  for (const prediction of predictions) {
    const key = `${prediction.homeScore}-${prediction.awayScore}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([score, count]) => ({
      score,
      count,
      pct: Math.round((count / predictions.length) * 100),
    }))
}

export type OutcomeFilter = "all" | "home" | "draw" | "away"

export function filterPredictionsByOutcome(
  predictions: ConsensusScoreInput[],
  filter: OutcomeFilter,
): ConsensusScoreInput[] {
  if (filter === "all") return predictions
  if (filter === "home") return predictions.filter((p) => p.homeScore > p.awayScore)
  if (filter === "draw") return predictions.filter((p) => p.homeScore === p.awayScore)
  return predictions.filter((p) => p.homeScore < p.awayScore)
}
