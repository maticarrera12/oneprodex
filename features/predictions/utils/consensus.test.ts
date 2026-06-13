import { describe, expect, it } from "vitest"

import { summarizeConsensusPredictions, computeOutcomeSplit, computeScoreDistribution } from "@/features/predictions/utils/consensus"

describe("summarizeConsensusPredictions", () => {
  it("returns the most common score and prediction count", () => {
    const summary = summarizeConsensusPredictions([
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1 },
      { homeScore: 1, awayScore: 0 },
    ])

    expect(summary).toEqual({ count: 3, topScore: "2-1", topScoreCount: 2 })
  })

  it("returns an empty summary when no group members predicted", () => {
    expect(summarizeConsensusPredictions([])).toEqual({ count: 0, topScore: null, topScoreCount: 0 })
  })
})

describe("computeOutcomeSplit", () => {
  it("returns win/draw/loss percentages", () => {
    const split = computeOutcomeSplit([
      { homeScore: 2, awayScore: 1 },
      { homeScore: 1, awayScore: 1 },
      { homeScore: 0, awayScore: 1 },
    ])

    expect(split.homePct).toBe(33)
    expect(split.drawPct).toBe(33)
    expect(split.awayPct).toBe(33)
  })
})

describe("computeScoreDistribution", () => {
  it("returns top scores with percentages", () => {
    const distribution = computeScoreDistribution([
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1 },
      { homeScore: 1, awayScore: 0 },
    ])

    expect(distribution[0]).toEqual({ score: "2-1", count: 2, pct: 67 })
  })
})
