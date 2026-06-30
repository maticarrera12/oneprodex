import { describe, expect, it } from "vitest"
import { BRACKET_SCORING, MATCH_SCORING, MATCHUP_HIT_SCORING } from "@/features/scoring/constants"
import {
  bracketPointsForSlot,
  buildBracketPickPointsUpdates,
  matchWinner,
  resolveBracketSlotForMatch,
  scoreMatchupHit,
  scoreKnockoutResult,
} from "@/features/scoring/bracket"
import type { SlotId } from "@/features/onboarding/types"

// ─── matchWinner ─────────────────────────────────────────────────────────────

describe("matchWinner", () => {
  const base = {
    id: "m1",
    home_team_code: "ARG",
    away_team_code: "FRA",
    home_score: null,
    away_score: null,
    home_pen_score: null,
    away_pen_score: null,
    status: "FINISHED",
    kickoff: "2026-07-19T18:00:00Z",
    stage: "Final",
  }

  it("returns null when status is not FINISHED", () => {
    const m = { ...base, home_score: 1, away_score: 0, status: "LIVE" }
    expect(matchWinner(m)).toBeNull()
  })

  it("returns null when home_score is null", () => {
    const m = { ...base, home_score: null, away_score: 0 }
    expect(matchWinner(m)).toBeNull()
  })

  it("returns null when away_score is null", () => {
    const m = { ...base, home_score: 1, away_score: null }
    expect(matchWinner(m)).toBeNull()
  })

  it("returns home team code when home wins regular time", () => {
    const m = { ...base, home_score: 2, away_score: 1 }
    expect(matchWinner(m)).toBe("ARG")
  })

  it("returns away team code when away wins regular time", () => {
    const m = { ...base, home_score: 0, away_score: 3 }
    expect(matchWinner(m)).toBe("FRA")
  })

  it("resolves draw via home penalty win → home team code", () => {
    const m = { ...base, home_score: 3, away_score: 3, home_pen_score: 4, away_pen_score: 2 }
    expect(matchWinner(m)).toBe("ARG")
  })

  it("resolves draw via away penalty win → away team code", () => {
    const m = { ...base, home_score: 1, away_score: 1, home_pen_score: 3, away_pen_score: 5 }
    expect(matchWinner(m)).toBe("FRA")
  })

  it("returns null on draw when penalty data is absent", () => {
    const m = { ...base, home_score: 2, away_score: 2, home_pen_score: null, away_pen_score: null }
    expect(matchWinner(m)).toBeNull()
  })

  it("returns null on draw when only one pen score is available", () => {
    const m = { ...base, home_score: 0, away_score: 0, home_pen_score: 4, away_pen_score: null }
    expect(matchWinner(m)).toBeNull()
  })

  it("returns null on draw when penalty scores are equal", () => {
    const m = { ...base, home_score: 1, away_score: 1, home_pen_score: 5, away_pen_score: 5 }
    expect(matchWinner(m)).toBeNull()
  })
})

// ─── bracketPointsForSlot ─────────────────────────────────────────────────────

// ─── scoreMatchupHit ─────────────────────────────────────────────────────────

describe("scoreMatchupHit", () => {
  // R16_P1 is fed by the winners the user picked at R32_P1 and R32_P2.
  const r16Picks = new Map<SlotId, string>([
    ["R32_P1", "ARG"],
    ["R32_P2", "FRA"],
    // QF_P1 is fed by R16_P1 and R16_P2 winners.
    ["R16_P1", "ARG"],
    ["R16_P2", "BRA"],
  ])

  it("awards the R16 bonus when the predicted pairing matches the real pairing", () => {
    expect(scoreMatchupHit("R16_P1", "ARG", "FRA", r16Picks)).toBe(MATCHUP_HIT_SCORING.R16)
  })

  it("is home/away order agnostic (set equality)", () => {
    expect(scoreMatchupHit("R16_P1", "FRA", "ARG", r16Picks)).toBe(MATCHUP_HIT_SCORING.R16)
  })

  it("awards the QF bonus from R16 parent picks (covers a second round)", () => {
    expect(scoreMatchupHit("QF_P1", "BRA", "ARG", r16Picks)).toBe(MATCHUP_HIT_SCORING.QF)
  })

  it("returns 0 when one of the two real teams was not predicted at this slot", () => {
    expect(scoreMatchupHit("R16_P1", "ARG", "GER", r16Picks)).toBe(0)
  })

  it("returns 0 when a parent pick is missing", () => {
    const partial = new Map<SlotId, string>([["R32_P1", "ARG"]])
    expect(scoreMatchupHit("R16_P1", "ARG", "FRA", partial)).toBe(0)
  })

  it("returns 0 for R32 (matchups come from group picks, not bracket picks)", () => {
    expect(scoreMatchupHit("R32_P1", "ARG", "FRA", r16Picks)).toBe(0)
  })

  it("returns 0 for THIRD", () => {
    expect(scoreMatchupHit("THIRD", "ARG", "FRA", r16Picks)).toBe(0)
  })
})

// ─── scoreKnockoutResult ─────────────────────────────────────────────────────

describe("scoreKnockoutResult", () => {
  const real = { homeTeam: "ARG", awayTeam: "FRA", homeScore: 3, awayScore: 1 }

  it("awards exact score when the aligned scoreline matches", () => {
    const pred = { homeTeam: "ARG", awayTeam: "FRA", homeScore: 3, awayScore: 1 }
    expect(scoreKnockoutResult(pred, real)).toBe(MATCH_SCORING.exactScore)
  })

  it("aligns by team code when the predicted card orientation is swapped", () => {
    // User predicted FRA(home) 1 - ARG(away) 3; real is ARG 3 - FRA 1 → same result
    const pred = { homeTeam: "FRA", awayTeam: "ARG", homeScore: 1, awayScore: 3 }
    expect(scoreKnockoutResult(pred, real)).toBe(MATCH_SCORING.exactScore)
  })

  it("awards correct-result when the outcome matches but the score differs", () => {
    const pred = { homeTeam: "ARG", awayTeam: "FRA", homeScore: 2, awayScore: 0 }
    expect(scoreKnockoutResult(pred, real)).toBe(MATCH_SCORING.correctResult)
  })

  it("returns 0 when the predicted outcome is wrong", () => {
    const pred = { homeTeam: "ARG", awayTeam: "FRA", homeScore: 0, awayScore: 1 }
    expect(scoreKnockoutResult(pred, real)).toBe(0)
  })

  it("returns 0 when the predicted scoreline is incomplete", () => {
    const pred = { homeTeam: "ARG", awayTeam: "FRA", homeScore: null, awayScore: 1 }
    expect(scoreKnockoutResult(pred, real)).toBe(0)
  })

  it("returns 0 when the predicted teams are not the real participants", () => {
    const pred = { homeTeam: "GER", awayTeam: "ESP", homeScore: 3, awayScore: 1 }
    expect(scoreKnockoutResult(pred, real)).toBe(0)
  })

  it("scores an exact draw (penalty-decided match) by regular-time scoreline", () => {
    const drawReal = { homeTeam: "ARG", awayTeam: "FRA", homeScore: 1, awayScore: 1 }
    const pred = { homeTeam: "ARG", awayTeam: "FRA", homeScore: 1, awayScore: 1 }
    expect(scoreKnockoutResult(pred, drawReal)).toBe(MATCH_SCORING.exactScore)
  })
})

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
