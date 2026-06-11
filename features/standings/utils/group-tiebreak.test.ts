import { describe, expect, it } from "vitest"

import {
  sortTeamsByOlympicTiebreak,
  type GroupMatchResult,
  type TeamGroupStats,
} from "@/features/standings/utils/group-tiebreak"

function stats(pts: number, gf: number, ga: number): TeamGroupStats {
  return { pts, gf, ga, gd: gf - ga }
}

function match(home: string, away: string, homeScore: number, awayScore: number): GroupMatchResult {
  return { home, away, homeScore, awayScore }
}

describe("sortTeamsByOlympicTiebreak", () => {
  it("ranks by points when not tied", () => {
    const teamStats = new Map<string, TeamGroupStats>([
      ["A1", stats(6, 4, 2)],
      ["A2", stats(3, 2, 3)],
      ["A3", stats(1, 1, 4)],
    ])

    expect(sortTeamsByOlympicTiebreak(teamStats, [])).toEqual(["A1", "A2", "A3"])
  })

  it("uses head-to-head before overall goal difference when two teams are tied on points", () => {
    const teamStats = new Map<string, TeamGroupStats>([
      ["A1", stats(3, 5, 1)],
      ["A2", stats(3, 1, 1)],
    ])
    const matches = [match("A2", "A1", 1, 0)]

    expect(sortTeamsByOlympicTiebreak(teamStats, matches)).toEqual(["A2", "A1"])
  })

  it("falls back to overall goal difference when head-to-head is a draw", () => {
    const teamStats = new Map<string, TeamGroupStats>([
      ["A1", stats(7, 5, 1)],
      ["A2", stats(7, 3, 1)],
    ])
    const matches = [match("A1", "A2", 1, 1)]

    expect(sortTeamsByOlympicTiebreak(teamStats, matches)).toEqual(["A1", "A2"])
  })

  it("uses mini-league among three tied teams before overall stats", () => {
    const teamStats = new Map<string, TeamGroupStats>([
      ["A1", stats(6, 3, 1)],
      ["A2", stats(6, 2, 2)],
      ["A3", stats(6, 5, 2)],
    ])
    const matches = [
      match("A1", "A2", 1, 1),
      match("A2", "A3", 1, 0),
      match("A1", "A3", 1, 1),
    ]

    expect(sortTeamsByOlympicTiebreak(teamStats, matches)).toEqual(["A2", "A1", "A3"])
  })

  it("breaks a three-way mini-league tie with overall goal difference", () => {
    const teamStats = new Map<string, TeamGroupStats>([
      ["A1", stats(4, 3, 2)],
      ["A2", stats(4, 2, 1)],
      ["A3", stats(4, 1, 2)],
    ])
    const matches = [
      match("A1", "A2", 1, 0),
      match("A2", "A3", 1, 0),
      match("A3", "A1", 1, 0),
    ]

    expect(sortTeamsByOlympicTiebreak(teamStats, matches)).toEqual(["A1", "A2", "A3"])
  })

  it("uses alphabetical order as final fallback", () => {
    const teamStats = new Map<string, TeamGroupStats>([
      ["A2", stats(1, 1, 1)],
      ["A1", stats(1, 1, 1)],
    ])
    const matches = [match("A1", "A2", 1, 1)]

    expect(sortTeamsByOlympicTiebreak(teamStats, matches)).toEqual(["A1", "A2"])
  })
})
