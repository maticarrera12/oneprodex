import { describe, expect, it } from "vitest"
import { computePredictionKind } from "@/features/profile/utils/prediction-kind"

describe("computePredictionKind", () => {
  it("returns exact when score matches", () => {
    expect(computePredictionKind(2, 1, 2, 1)).toBe("exact")
  })

  it("returns result when winner matches but not score", () => {
    expect(computePredictionKind(1, 0, 3, 0)).toBe("result")
  })

  it("returns miss when winner differs", () => {
    expect(computePredictionKind(2, 1, 1, 1)).toBe("miss")
  })
})
