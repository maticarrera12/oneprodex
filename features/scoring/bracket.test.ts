import { describe, expect, it } from "vitest"
import { BRACKET_SCORING } from "@/features/scoring/constants"
import {
  bracketPointsForSlot,
  buildBracketPickPointsUpdates,
  resolveBracketSlotForMatch,
} from "@/features/scoring/bracket"

describe("bracketPointsForSlot", () => {
  it("escalates by round", () => {
    expect(bracketPointsForSlot("R32_P1")).toBe(BRACKET_SCORING.R32)
    expect(bracketPointsForSlot("R16_P1")).toBe(BRACKET_SCORING.R16)
    expect(bracketPointsForSlot("QF_P1")).toBe(BRACKET_SCORING.QF)
    expect(bracketPointsForSlot("SF_P1")).toBe(BRACKET_SCORING.SF)
    expect(bracketPointsForSlot("THIRD")).toBe(BRACKET_SCORING.THIRD)
    expect(bracketPointsForSlot("FINAL")).toBe(BRACKET_SCORING.FINAL)
  })
})

describe("buildBracketPickPointsUpdates", () => {
  it("awards points only to correct winner picks", () => {
    const updates = buildBracketPickPointsUpdates("R32_P1", "ENG", [
      { user_id: "u1", team_code: "ENG" },
      { user_id: "u2", team_code: "PAN" },
    ])

    expect(updates).toEqual([
      { user_id: "u1", slot: "R32_P1", points: BRACKET_SCORING.R32 },
      { user_id: "u2", slot: "R32_P1", points: 0 },
    ])
  })
})

describe("resolveBracketSlotForMatch", () => {
  it("maps FIFA R32 kickoff order to app slots", () => {
    const stageMatches = [
      { id: "m73", kickoff: "2026-06-28T00:00:00Z", stage: "Round of 32" },
      { id: "m74", kickoff: "2026-06-28T03:00:00Z", stage: "Round of 32" },
    ]

    expect(
      resolveBracketSlotForMatch(
        {
          id: "m73",
          home_team_code: "A",
          away_team_code: "B",
          home_score: 1,
          away_score: 0,
          status: "FINISHED",
          kickoff: "2026-06-28T00:00:00Z",
          stage: "Round of 32",
        },
        stageMatches,
      ),
    ).toBe("R32_P3")

    expect(
      resolveBracketSlotForMatch(
        {
          id: "m74",
          home_team_code: "E",
          away_team_code: "X",
          home_score: 2,
          away_score: 1,
          status: "FINISHED",
          kickoff: "2026-06-28T03:00:00Z",
          stage: "Round of 32",
        },
        stageMatches,
      ),
    ).toBe("R32_P1")
  })
})
