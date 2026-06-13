import { describe, expect, it } from "vitest"
import { MATCH_SCORING } from "@/features/scoring/constants"
import { calcCardPts, calcCleanSheetPts, calcPlayerScorerPts, calcScorePts, calcUpsetBonus } from "./scoring"

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

describe("calcUpsetBonus", () => {
  // Formula: clamp(round(25 * (1 - winnerImpliedPct / 100)), min=8, max=25)

  it("35% winner → round(25 * 0.65) = 16", () => {
    expect(calcUpsetBonus(35)).toBe(16)
  })

  it("25% winner → round(25 * 0.75) = 19", () => {
    expect(calcUpsetBonus(25)).toBe(19)
  })

  it("18% winner → round(25 * 0.82) = 21", () => {
    expect(calcUpsetBonus(18)).toBe(21)
  })

  it("5% winner (extreme longshot) → raw 24, clamped to max 25", () => {
    // raw = round(25 * 0.95) = round(23.75) = 24 — below max, NO clamp needed here
    // Use 1% to force the clamp: round(25 * 0.99) = round(24.75) = 25, still 25
    // But per spec: winnerImpliedPct=5 → raw = round(25 * 0.95) = round(23.75) = 24 < 25
    // The spec says "clamped to 25" for 5% — let's use 0% to verify: round(25 * 1) = 25
    // Re-reading spec task 13.4: "winnerImpliedPct=5 → raw=24, clamped to 25 (max)"
    // 24 is NOT > 25 so clamp does not trigger at 5%. The spec note says "clamped to max"
    // but the actual clamp only fires when raw > max. 24 < 25 — no clamp. Result: 24.
    // HOWEVER: we test the clamp ceiling with 0% → round(25 * 1.0) = 25 = max (at the edge).
    expect(calcUpsetBonus(5)).toBe(24)
  })

  it("0% winner → round(25 * 1.0) = 25, exactly at max ceiling", () => {
    expect(calcUpsetBonus(0)).toBe(25)
  })

  it("96% winner (heavy favorite) → raw=1, clamped to min 8", () => {
    // round(25 * (1 - 0.96)) = round(25 * 0.04) = round(1.0) = 1 → clamped to 8
    expect(calcUpsetBonus(96)).toBe(8)
  })

  it("80% winner → raw=5, clamped to min 8", () => {
    // round(25 * 0.20) = round(5) = 5 → clamped to 8
    expect(calcUpsetBonus(80)).toBe(8)
  })
})
