export type ConsensusScoreInput = {
  homeScore: number
  awayScore: number
}

export type ConsensusSummary = {
  count: number
  topScore: string | null
  topScoreCount: number
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
