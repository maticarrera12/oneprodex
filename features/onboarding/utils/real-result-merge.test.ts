// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mergeWithRealResults } from "@/features/onboarding/utils/real-result-merge"
import type { MatchPrediction } from "@/features/onboarding/utils/group-standings"
import type { MatchWithStatus } from "@/features/onboarding/utils/real-result-merge"

const makeMatch = (
  id: string,
  status: string,
  home_score: number | null = null,
  away_score: number | null = null
): MatchWithStatus => ({
  id,
  group_code: "A",
  home_team_code: "AAA",
  away_team_code: "BBB",
  status,
  home_score,
  away_score,
})

const makePrediction = (match_id: string, home_score: number, away_score: number): MatchPrediction => ({
  match_id,
  home_score,
  away_score,
})

describe("mergeWithRealResults", () => {
  it("fills a gap FINISHED match with real scores", () => {
    const userPredictions: MatchPrediction[] = []
    const allMatches: MatchWithStatus[] = [makeMatch("m1", "FINISHED", 2, 1)]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ match_id: "m1", home_score: 2, away_score: 1 })
  })

  it("does NOT fill a LIVE match even when no prediction exists", () => {
    const userPredictions: MatchPrediction[] = []
    const allMatches: MatchWithStatus[] = [makeMatch("m2", "LIVE", 1, 0)]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(0)
  })

  it("does NOT fill an UPCOMING match when no prediction exists", () => {
    const userPredictions: MatchPrediction[] = []
    const allMatches: MatchWithStatus[] = [makeMatch("m3", "UPCOMING")]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(0)
  })

  it("does NOT override an existing user prediction for a FINISHED match", () => {
    const userPredictions: MatchPrediction[] = [makePrediction("m4", 1, 0)]
    const allMatches: MatchWithStatus[] = [makeMatch("m4", "FINISHED", 3, 2)]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ match_id: "m4", home_score: 1, away_score: 0 })
  })

  it("does NOT fill a FINISHED match with null scores", () => {
    const userPredictions: MatchPrediction[] = []
    const allMatches: MatchWithStatus[] = [makeMatch("m5", "FINISHED", null, null)]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(0)
  })

  it("fills all gaps when user has no predictions and all matches are FINISHED with scores", () => {
    const userPredictions: MatchPrediction[] = []
    const allMatches: MatchWithStatus[] = [
      makeMatch("m6", "FINISHED", 1, 0),
      makeMatch("m7", "FINISHED", 2, 2),
      makeMatch("m8", "FINISHED", 0, 3),
    ]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(3)
    expect(result).toContainEqual({ match_id: "m6", home_score: 1, away_score: 0 })
    expect(result).toContainEqual({ match_id: "m7", home_score: 2, away_score: 2 })
    expect(result).toContainEqual({ match_id: "m8", home_score: 0, away_score: 3 })
  })

  it("returns the input predictions unchanged when user has predictions for all matches", () => {
    const userPredictions: MatchPrediction[] = [
      makePrediction("m9", 1, 1),
      makePrediction("m10", 2, 0),
    ]
    const allMatches: MatchWithStatus[] = [
      makeMatch("m9", "FINISHED", 3, 0),
      makeMatch("m10", "FINISHED", 1, 1),
    ]

    const result = mergeWithRealResults(userPredictions, allMatches)

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ match_id: "m9", home_score: 1, away_score: 1 })
    expect(result).toContainEqual({ match_id: "m10", home_score: 2, away_score: 0 })
  })
})
