import { describe, expect, it } from "vitest"

import {
  buildGroupTeamAliasMap,
  computeProjectedStandingRowsByGroup,
} from "@/features/standings/utils/projected-standings"

const baseGroups = new Map([
  ["A", ["ARG", "BRA", "URU", "CHI"]],
  ["B", ["ESP", "FRA", "GER", "ITA"]],
])

describe("computeProjectedStandingRowsByGroup", () => {
  it("seeds every team with zero stats when a group has no predictions", () => {
    const rowsByGroup = computeProjectedStandingRowsByGroup({
      groupToTeams: baseGroups,
      matches: [
        { id: "m1", groupCode: "A", home: "ARG", away: "BRA" },
        { id: "m2", groupCode: "B", home: "ESP", away: "FRA" },
      ],
      predictions: [],
      buildRow: (team, accum, position) => ({ team, accum, position }),
    })

    expect(rowsByGroup.get("A")?.map((row) => row.team)).toEqual(["ARG", "BRA", "CHI", "URU"])
    expect(rowsByGroup.get("A")?.every((row) => row.accum.pj === 0 && row.accum.pts === 0)).toBe(true)
    expect(rowsByGroup.get("B")?.every((row) => row.accum.pj === 0 && row.accum.pts === 0)).toBe(true)
  })

  it("calculates projected standings from the user's predicted scores", () => {
    const rowsByGroup = computeProjectedStandingRowsByGroup({
      groupToTeams: baseGroups,
      matches: [
        { id: "m1", groupCode: "A", home: "ARG", away: "BRA" },
        { id: "m2", groupCode: "A", home: "URU", away: "CHI" },
      ],
      predictions: [
        { matchId: "m1", homeScore: 2, awayScore: 1 },
        { matchId: "m2", homeScore: 0, awayScore: 0 },
      ],
      buildRow: (team, accum, position) => ({ team, accum, position }),
    })

    const groupA = rowsByGroup.get("A")
    expect(groupA?.[0]).toMatchObject({ team: "ARG", accum: { pj: 1, g: 1, e: 0, p: 0, gf: 2, ga: 1, gd: 1, pts: 3 } })
    expect(groupA?.[1]).toMatchObject({ team: "CHI", accum: { pj: 1, e: 1, pts: 1 } })
    expect(groupA?.[2]).toMatchObject({ team: "URU", accum: { pj: 1, e: 1, pts: 1 } })
    expect(groupA?.[3]).toMatchObject({ team: "BRA", accum: { pj: 1, p: 1, gd: -1, pts: 0 } })
  })

  it("uses head-to-head before overall goal difference when teams are tied on points", () => {
    const rowsByGroup = computeProjectedStandingRowsByGroup({
      groupToTeams: new Map([["A", ["ARG", "BRA", "URU", "CHI"]]]),
      matches: [
        { id: "m1", groupCode: "A", home: "ARG", away: "BRA" },
        { id: "m2", groupCode: "A", home: "ARG", away: "URU" },
        { id: "m3", groupCode: "A", home: "BRA", away: "URU" },
      ],
      predictions: [
        { matchId: "m1", homeScore: 0, awayScore: 1 },
        { matchId: "m2", homeScore: 4, awayScore: 0 },
        { matchId: "m3", homeScore: 1, awayScore: 0 },
      ],
      buildRow: (team, accum, position) => ({ team, accum, position }),
    })

    expect(rowsByGroup.get("A")?.slice(0, 2).map((row) => row.team)).toEqual(["BRA", "ARG"])
  })

  it("maps alternate team codes onto the roster so every predicted match counts", () => {
    const groupToTeams = new Map([["A", ["ARG", "BRA", "URU", "CHI"]]])
    const teamAliasesByGroup = buildGroupTeamAliasMap(
      groupToTeams,
      new Map([
        ["ARG", 1001],
        ["BRA", 1002],
        ["URU", 1003],
        ["CHI", 1004],
      ]),
    )

    const rowsByGroup = computeProjectedStandingRowsByGroup({
      groupToTeams,
      teamAliasesByGroup,
      matches: [
        { id: "m1", groupCode: "A", home: "1001", away: "1002" },
        { id: "m2", groupCode: "A", home: "1001", away: "1003" },
        { id: "m3", groupCode: "A", home: "1001", away: "1004" },
        { id: "m4", groupCode: "A", home: "1002", away: "1003" },
        { id: "m5", groupCode: "A", home: "1002", away: "1004" },
        { id: "m6", groupCode: "A", home: "1003", away: "1004" },
      ],
      predictions: [
        { matchId: "m1", homeScore: 1, awayScore: 0 },
        { matchId: "m2", homeScore: 2, awayScore: 0 },
        { matchId: "m3", homeScore: 1, awayScore: 0 },
        { matchId: "m4", homeScore: 0, awayScore: 0 },
        { matchId: "m5", homeScore: 1, awayScore: 1 },
        { matchId: "m6", homeScore: 0, awayScore: 1 },
      ],
      buildRow: (team, accum) => ({ team, accum }),
    })

    const groupA = rowsByGroup.get("A")
    expect(groupA).toHaveLength(4)
    expect(groupA?.find((row) => row.team === "ARG")?.accum.pj).toBe(3)
    expect(groupA?.find((row) => row.team === "BRA")?.accum.pj).toBe(3)
    expect(groupA?.find((row) => row.team === "URU")?.accum.pj).toBe(3)
    expect(groupA?.find((row) => row.team === "CHI")?.accum.pj).toBe(3)
  })
})
