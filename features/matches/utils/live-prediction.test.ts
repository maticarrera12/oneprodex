import { describe, expect, it } from "vitest"
import { isLivePredictionExact, isLivePredictionOnTrack } from "./live-prediction"

describe("isLivePredictionOnTrack", () => {
  it("is on track when predicted home win and home is ahead", () => {
    expect(isLivePredictionOnTrack({ hs: 2, as: 1 }, { hs: 1, as: 0 })).toBe(true)
  })

  it("is on track when predicted away win and away is ahead", () => {
    expect(isLivePredictionOnTrack({ hs: 0, as: 2 }, { hs: 1, as: 3 })).toBe(true)
  })

  it("is on track when predicted draw and match is tied", () => {
    expect(isLivePredictionOnTrack({ hs: 1, as: 1 }, { hs: 0, as: 0 })).toBe(true)
  })

  it("is at risk when predicted home win but away is ahead", () => {
    expect(isLivePredictionOnTrack({ hs: 2, as: 0 }, { hs: 0, as: 1 })).toBe(false)
  })

  it("is at risk when predicted draw but someone is winning", () => {
    expect(isLivePredictionOnTrack({ hs: 0, as: 0 }, { hs: 1, as: 0 })).toBe(false)
  })
})

describe("isLivePredictionExact", () => {
  it("matches only on exact score", () => {
    expect(isLivePredictionExact({ hs: 2, as: 1 }, { hs: 2, as: 1 })).toBe(true)
    expect(isLivePredictionExact({ hs: 2, as: 1 }, { hs: 1, as: 0 })).toBe(false)
  })
})
