import { describe, expect, it } from "vitest"
import { MATCH_SCORING } from "@/features/scoring/constants"
import { calcCardPts, calcCleanSheetPts, calcPlayerScorerPts, calcScorePts } from "./scoring"

describe("calcScorePts", () => {
  it("exact score → 25", () => {
    expect(calcScorePts({ home_score: 2, away_score: 1 }, { home: 2, away: 1 })).toBe(MATCH_SCORING.exactScore)
  })

  it("correct home win → 12", () => {
    expect(calcScorePts({ home_score: 1, away_score: 0 }, { home: 3, away: 0 })).toBe(MATCH_SCORING.correctResult)
  })

  it("correct draw → 12", () => {
    expect(calcScorePts({ home_score: 1, away_score: 1 }, { home: 0, away: 0 })).toBe(MATCH_SCORING.correctResult)
  })

  it("correct away win → 12", () => {
    expect(calcScorePts({ home_score: 0, away_score: 2 }, { home: 0, away: 3 })).toBe(MATCH_SCORING.correctResult)
  })

  it("wrong result → 0", () => {
    expect(calcScorePts({ home_score: 2, away_score: 0 }, { home: 0, away: 1 })).toBe(0)
  })

  it("null result → 0", () => {
    expect(calcScorePts({ home_score: 2, away_score: 1 }, { home: null, away: null })).toBe(0)
  })

  it("single scorer is worth less than correct result", () => {
    expect(MATCH_SCORING.scorer).toBeLessThan(MATCH_SCORING.correctResult)
  })
})

describe("calcPlayerScorerPts", () => {
  it("all correct → scorer * N", () => {
    expect(calcPlayerScorerPts([10, 20], [10, 20, 30])).toBe(MATCH_SCORING.scorer * 2)
  })

  it("none correct → 0", () => {
    expect(calcPlayerScorerPts([10, 20], [30, 40])).toBe(0)
  })

  it("partial → scorer * correct count", () => {
    expect(calcPlayerScorerPts([10, 20, 30], [10, 99])).toBe(MATCH_SCORING.scorer)
  })
})

describe("calcCardPts", () => {
  it("correct yellow", () => {
    expect(calcCardPts([10], [], [10, 20], [])).toBe(MATCH_SCORING.yellowCard)
  })

  it("correct red", () => {
    expect(calcCardPts([], [10], [], [10])).toBe(MATCH_SCORING.redCard)
  })

  it("correct yellow + red", () => {
    expect(calcCardPts([10], [20], [10], [20])).toBe(MATCH_SCORING.yellowCard + MATCH_SCORING.redCard)
  })
})

describe("calcCleanSheetPts", () => {
  it("home keeps clean sheet, correctly predicted", () => {
    expect(calcCleanSheetPts(["HOME"], "HOME", "AWAY", 0, 2)).toBe(MATCH_SCORING.cleanSheet)
  })

  it("both keep clean sheet, both predicted", () => {
    expect(calcCleanSheetPts(["HOME", "AWAY"], "HOME", "AWAY", 0, 0)).toBe(MATCH_SCORING.cleanSheet * 2)
  })
})
