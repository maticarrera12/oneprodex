import { describe, expect, it } from "vitest"

import { computeProjectedStandingRowsByGroup } from "@/features/standings/utils/projected-standings"

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

    expect(rowsByGroup.get("A")?.map((row) => row.team)).toEqual(["ARG", "BRA", "URU", "CHI"])
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
    expect(groupA?.[1]).toMatchObject({ team: "URU", accum: { pj: 1, e: 1, pts: 1 } })
    expect(groupA?.[2]).toMatchObject({ team: "CHI", accum: { pj: 1, e: 1, pts: 1 } })
    expect(groupA?.[3]).toMatchObject({ team: "BRA", accum: { pj: 1, p: 1, gd: -1, pts: 0 } })
  })
})
