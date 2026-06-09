import { describe, expect, it, vi } from "vitest"
import { getStandingsByGroup } from "@/features/standings/api/index"

type MatchAggRow = {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  group_code: string | null
  status: string
  kickoff: string
  minute: number | null
  stage: string
}

function buildSupabase(matchRows: MatchAggRow[], teamRows: unknown[] = []) {
  // The implementation uses Promise.all with two parallel queries:
  //   1. from("matches").select(...).not(...)
  //   2. from("teams").select(...)
  //
  // We intercept by tracking which "from" call is which.
  let matchesCallCount = 0
  let teamsCallCount = 0

  const matchesChain = {
    not: vi.fn().mockReturnValue({
      data: matchRows,
      error: null,
    }),
  }

  const teamsChain = {
    data: teamRows,
    error: null,
  }

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "matches") {
      matchesCallCount++
      return {
        select: vi.fn().mockReturnValue(matchesChain),
      }
    }
    if (table === "teams") {
      teamsCallCount++
      return {
        select: vi.fn().mockReturnValue(teamsChain),
      }
    }
    return { select: vi.fn().mockReturnValue({ data: [], error: null }) }
  })

  return { from }
}

describe("features/standings/api — on-the-fly aggregation", () => {
  it("groups by group_code and sorts by pts desc (home-win + draw scenario)", async () => {
    // Group A: BRA beats ARG 2-0 (BRA 3pts), ARG draws URU 1-1 (ARG 1pt, URU 1pt)
    // Group B: ESP beats FRA 1-0 (ESP 3pts)
    const supabase = buildSupabase([
      {
        id: "m1",
        home_team_code: "BRA",
        away_team_code: "ARG",
        home_score: 2,
        away_score: 0,
        group_code: "Group A",
        status: "FINISHED",
        kickoff: "2026-06-01T12:00:00Z",
        minute: null,
        stage: "Group Stage",
      },
      {
        id: "m2",
        home_team_code: "ARG",
        away_team_code: "URU",
        home_score: 1,
        away_score: 1,
        group_code: "Group A",
        status: "FINISHED",
        kickoff: "2026-06-05T15:00:00Z",
        minute: null,
        stage: "Group Stage",
      },
      {
        id: "m3",
        home_team_code: "ESP",
        away_team_code: "FRA",
        home_score: 1,
        away_score: 0,
        group_code: "Group B",
        status: "FINISHED",
        kickoff: "2026-06-02T18:00:00Z",
        minute: null,
        stage: "Group Stage",
      },
    ])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups.map((g) => g.id)).toEqual(["A", "B"])
    // Group A: BRA 3pts, ARG 1pt, URU 1pt (ARG ahead by gd: -1+1=0 vs URU 0+1-1=-0 → equal gd,
    // but ARG has 1 gf vs URU 1 gf — same, so order is stable by insertion ARG then URU)
    // BRA must be first
    expect(groups[0]?.rows[0]?.team).toBe("BRA")
    expect(groups[0]?.rows[0]?.pts).toBe(3)
  })

  it("returns empty array when no match rows exist", async () => {
    const supabase = buildSupabase([])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups).toEqual([])
  })

  it("team with only UPCOMING matches appears with all-zero stats", async () => {
    const supabase = buildSupabase([
      {
        id: "m1",
        home_team_code: "BRA",
        away_team_code: "ARG",
        home_score: null,
        away_score: null,
        group_code: "A",
        status: "UPCOMING",
        kickoff: "2026-06-10T12:00:00Z",
        minute: null,
        stage: "Group Stage",
      },
    ])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.id).toBe("A")

    const teamCodes = groups[0]?.rows.map((r) => r.team) ?? []
    expect(teamCodes).toContain("BRA")
    expect(teamCodes).toContain("ARG")

    for (const row of groups[0]?.rows ?? []) {
      expect(row.g).toBe(0)
      expect(row.e).toBe(0)
      expect(row.p).toBe(0)
      expect(row.gd).toBe(0)
      expect(row.pts).toBe(0)
      expect(row.pj).toBe(0)
    }
  })

  it("LIVE match score is reflected in aggregation", async () => {
    const supabase = buildSupabase([
      {
        id: "m1",
        home_team_code: "ESP",
        away_team_code: "FRA",
        home_score: 2,
        away_score: 1,
        group_code: "C",
        status: "LIVE",
        kickoff: "2026-06-08T20:00:00Z",
        minute: 65,
        stage: "Group Stage",
      },
    ])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups).toHaveLength(1)
    const espRow = groups[0]?.rows.find((r) => r.team === "ESP")
    const fraRow = groups[0]?.rows.find((r) => r.team === "FRA")

    expect(espRow?.g).toBe(1)
    expect(espRow?.pts).toBe(3)
    expect(espRow?.gd).toBe(1) // gf 2 - ga 1

    expect(fraRow?.p).toBe(1)
    expect(fraRow?.pts).toBe(0)
    expect(fraRow?.gd).toBe(-1)
  })

  it("UPCOMING rows do not contribute to W/D/L/GF/GA/PTS", async () => {
    const supabase = buildSupabase([
      {
        id: "m1",
        home_team_code: "GER",
        away_team_code: "ITA",
        home_score: null,
        away_score: null,
        group_code: "D",
        status: "UPCOMING",
        kickoff: "2026-06-15T16:00:00Z",
        minute: null,
        stage: "Group Stage",
      },
    ])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups).toHaveLength(1)
    for (const row of groups[0]?.rows ?? []) {
      expect(row.g).toBe(0)
      expect(row.e).toBe(0)
      expect(row.p).toBe(0)
      expect(row.gd).toBe(0)
      expect(row.pts).toBe(0)
      expect(row.pj).toBe(0)
    }
  })
})
