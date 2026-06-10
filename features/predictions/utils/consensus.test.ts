import { describe, expect, it } from "vitest"

import { summarizeConsensusPredictions } from "@/features/predictions/utils/consensus"

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
