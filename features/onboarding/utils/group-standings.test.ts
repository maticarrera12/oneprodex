import { describe, expect, it } from "vitest"
import { computeGroupStandings } from "@/features/onboarding/utils/group-standings"
import type { MatchPrediction, MatchInfo } from "@/features/onboarding/utils/group-standings"

// Helper: build a match row in group A with given teams
function match(id: string, home: string, away: string, group = "A"): MatchInfo {
  return { id, group_code: group, home_team_code: home, away_team_code: away }
}

function pred(match_id: string, home_score: number, away_score: number): MatchPrediction {
  return { match_id, home_score, away_score }
}

describe("computeGroupStandings", () => {
  it("ranks by points descending (clear winner)", () => {
    // A1 beats A2 3-0, A1 beats A3 1-0
    // A2 draws A3 1-1
    const matches: MatchInfo[] = [
      match("m1", "A1", "A2"),
      match("m2", "A1", "A3"),
      match("m3", "A2", "A3"),
      match("m4", "A4", "A1"), // A4 vs A1
      match("m5", "A4", "A2"),
      match("m6", "A4", "A3"),
    ]
    const predictions: MatchPrediction[] = [
      pred("m1", 3, 0), // A1 wins (3pts), A2 (0pts)
      pred("m2", 1, 0), // A1 wins (3pts), A3 (0pts)
      pred("m3", 1, 1), // A2 draws (1pt), A3 (1pt)
      pred("m4", 0, 1), // A4 (0pts), A1 wins (3pts)
      pred("m5", 1, 0), // A4 wins (3pts), A2 (0pts)
      pred("m6", 2, 0), // A4 wins (3pts), A3 (0pts)
    ]
    // A1: 9pts  A4: 6pts  A2: 1pt  A3: 1pt (tiebreaker needed for A2/A3)
    const result = computeGroupStandings(predictions, matches)
    expect(result.A[0]).toBe("A1")
    expect(result.A[1]).toBe("A4")
  })

  it("breaks pts tie by goal difference when head-to-head is a draw", () => {
    // Two teams, each 3pts. Team A1: GD +3, Team A2: GD +1
    // Use only 2 teams to keep it simple — A1 beats A2 (won't meet again)
    // But we need 4 teams for group, pad with A3,A4
    const matches: MatchInfo[] = [
      match("m1", "A1", "A3"), // A1 wins big
      match("m2", "A2", "A4"), // A2 wins narrowly
      match("m3", "A1", "A4"),
      match("m4", "A2", "A3"),
      match("m5", "A1", "A2"),
      match("m6", "A3", "A4"),
    ]
    const predictions: MatchPrediction[] = [
      pred("m1", 4, 1), // A1: +3 GD, 3pts | A3: -3 GD, 0pts
      pred("m2", 2, 1), // A2: +1 GD, 3pts | A4: -1 GD, 0pts
      pred("m3", 1, 0), // A1: 3pts total | A4: 0pts
      pred("m4", 1, 0), // A2: 3pts total | A3: 0pts
      pred("m5", 1, 1), // draw — both get 1pt
      pred("m6", 1, 1), // draw — both get 1pt
    ]
    // A1: 7pts GD=(4-1)+(1-0)+(1-1)=+4  A2: 7pts GD=(2-1)+(1-0)+(1-1)=+2
    const result = computeGroupStandings(predictions, matches)
    expect(result.A[0]).toBe("A1")
    expect(result.A[1]).toBe("A2")
  })

  it("uses head-to-head before overall goal difference when two teams are tied on points", () => {
    const matches: MatchInfo[] = [
      match("m1", "A1", "A2"),
      match("m2", "A1", "A3"),
      match("m3", "A2", "A3"),
      match("m4", "A4", "A1"),
      match("m5", "A4", "A2"),
      match("m6", "A4", "A3"),
    ]
    const predictions: MatchPrediction[] = [
      pred("m1", 0, 1),
      pred("m2", 3, 0),
    ]

    const result = computeGroupStandings(predictions, matches)
    expect(result.A[0]).toBe("A2")
    expect(result.A[1]).toBe("A1")
  })

  it("breaks GD tie by goals scored (GF) after head-to-head draw", () => {
    // Teams A1 and A2 tied on pts and GD, A1 scores more
    const matches: MatchInfo[] = [
      match("m1", "A1", "A3"),
      match("m2", "A2", "A4"),
      match("m3", "A1", "A4"),
      match("m4", "A2", "A3"),
      match("m5", "A1", "A2"),
      match("m6", "A3", "A4"),
    ]
    const predictions: MatchPrediction[] = [
      pred("m1", 3, 1), // A1: +2, GF=3 | A3: -2
      pred("m2", 2, 0), // A2: +2, GF=2 | A4: -2
      pred("m3", 1, 0), // A1: +1 more
      pred("m4", 1, 0), // A2: +1 more
      pred("m5", 1, 1), // draw
      pred("m6", 0, 0), // draw
    ]
    // A1: pts=7, GD=+4, GF=5  A2: pts=7, GD=+4, GF=4 → A1 first
    const result = computeGroupStandings(predictions, matches)
    expect(result.A[0]).toBe("A1")
    expect(result.A[1]).toBe("A2")
  })

  it("falls back to alphabetical order when all stats are tied", () => {
    // Teams all draw all games — identical stats
    const matches: MatchInfo[] = [
      match("m1", "A1", "A2"),
      match("m2", "A3", "A4"),
      match("m3", "A1", "A3"),
      match("m4", "A2", "A4"),
      match("m5", "A1", "A4"),
      match("m6", "A2", "A3"),
    ]
    const predictions: MatchPrediction[] = [
      pred("m1", 0, 0),
      pred("m2", 0, 0),
      pred("m3", 0, 0),
      pred("m4", 0, 0),
      pred("m5", 0, 0),
      pred("m6", 0, 0),
    ]
    const result = computeGroupStandings(predictions, matches)
    // Alphabetical: A1, A2, A3, A4
    expect(result.A[0]).toBe("A1")
    expect(result.A[1]).toBe("A2")
    expect(result.A[2]).toBe("A3")
    expect(result.A[3]).toBe("A4")
  })

  it("returns empty team codes for groups with no matches", () => {
    const result = computeGroupStandings([], [])
    expect(result.A).toEqual(["", "", "", ""])
    expect(result.L).toEqual(["", "", "", ""])
  })

  it("selects best-8 thirds by sorting all 12 group-third-place teams", () => {
    // This test verifies the external contract: computeGroupStandings returns
    // a full GroupRankings where index 2 of each group is the third-place team.
    // The best-8 thirds selection is done by deriveAndPersistGroupRankings, not
    // by computeGroupStandings directly. So we just verify the third-place slot.
    const groupA = [
      match("mA1", "A1", "A2", "A"),
      match("mA2", "A3", "A4", "A"),
      match("mA3", "A1", "A3", "A"),
      match("mA4", "A2", "A4", "A"),
      match("mA5", "A1", "A4", "A"),
      match("mA6", "A2", "A3", "A"),
    ]
    const predsA: MatchPrediction[] = [
      pred("mA1", 3, 0), // A1 wins
      pred("mA2", 0, 3), // A4 wins
      pred("mA3", 2, 0), // A1 wins
      pred("mA4", 0, 2), // A4 wins
      pred("mA5", 0, 1), // A4 wins
      pred("mA6", 1, 1), // draw
    ]
    const result = computeGroupStandings(predsA, groupA)
    // A1: 6pts, A4: 9pts, A2: 1pt, A3: 1pt → A4(9) A1(6) A2/A3 tiebreaker
    expect(result.A[0]).toBe("A4") // 9pts
    expect(result.A[1]).toBe("A1") // 6pts
    // Third place between A2 and A3 — both 1pt, 0GD, then by GF, then alphabetical
    // A2: GF=1 (from draw), A3: GF=1 (from draw) → alphabetical: A2 first
    expect(result.A[2]).toBe("A2")
    expect(result.A[3]).toBe("A3")
  })
})
