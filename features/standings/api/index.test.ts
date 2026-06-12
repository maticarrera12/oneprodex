import { describe, expect, it, vi } from "vitest"
import { getStandingsByGroup } from "@/features/standings/api/index"

// applyWorldCupSeasonKickoffFilter chains .gte/.lt — pass through in tests;
// the filter itself is covered by lib/world-cup/season.test.ts
vi.mock("@/lib/world-cup/season", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/world-cup/season")>()
  return { ...actual, applyWorldCupSeasonKickoffFilter: (query: unknown) => query }
})

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

function buildSupabase(
  matchRows: MatchAggRow[],
  teamRows: unknown[] = [],
  options?: {
    standingsRows?: Array<{ group_code: string; team_code: string }>
    predictions?: Array<{ match_id: string; home_score: number; away_score: number }>
    userId?: string
  },
) {
  const standingsRows = options?.standingsRows ?? Array.from(
    matchRows.reduce((acc, row) => {
      if (!row.group_code) return acc
      acc.set(`${row.group_code}:${row.home_team_code}`, { group_code: row.group_code, team_code: row.home_team_code })
      acc.set(`${row.group_code}:${row.away_team_code}`, { group_code: row.group_code, team_code: row.away_team_code })
      return acc
    }, new Map<string, { group_code: string; team_code: string }>())
      .values(),
  )

  const predictions = options?.predictions ?? []

  const standingsChain = {
    order: vi.fn().mockReturnValue({ data: standingsRows, error: null }),
  }

  const matchesChain = {
    ilike: vi.fn().mockReturnValue({ data: matchRows, error: null }),
  }

  const teamsChain = { data: teamRows, error: null }

  const predictionsChain = {
    eq: vi.fn().mockReturnValue({ data: predictions, error: null }),
  }

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "standings") {
      return {
        select: vi.fn().mockReturnValue(standingsChain),
      }
    }
    if (table === "matches") {
      return {
        select: vi.fn().mockReturnValue(matchesChain),
      }
    }
    if (table === "teams") {
      return {
        select: vi.fn().mockReturnValue(teamsChain),
      }
    }
    if (table === "predictions") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ data: predictions, error: null }),
        }),
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

  it("projected standings include real scores for unpredicted FINISHED matches (gap-fill)", async () => {
    // Group A: 4 teams, 6 matches. User predicted 5; match m6 (A3 vs A4, FINISHED 2-0) has no prediction.
    // After gap-fill, A3 should appear with at least 3 pts in projectedRows (winning m6 earns 3 pts).
    const groupAMatches: MatchAggRow[] = [
      { id: "m1", home_team_code: "A1", away_team_code: "A2", home_score: null, away_score: null, group_code: "A", status: "UPCOMING", kickoff: "2026-06-01T12:00:00Z", minute: null, stage: "Group Stage - 1" },
      { id: "m2", home_team_code: "A1", away_team_code: "A3", home_score: null, away_score: null, group_code: "A", status: "UPCOMING", kickoff: "2026-06-01T15:00:00Z", minute: null, stage: "Group Stage - 1" },
      { id: "m3", home_team_code: "A2", away_team_code: "A3", home_score: null, away_score: null, group_code: "A", status: "UPCOMING", kickoff: "2026-06-02T12:00:00Z", minute: null, stage: "Group Stage - 2" },
      { id: "m4", home_team_code: "A1", away_team_code: "A4", home_score: null, away_score: null, group_code: "A", status: "UPCOMING", kickoff: "2026-06-02T15:00:00Z", minute: null, stage: "Group Stage - 2" },
      { id: "m5", home_team_code: "A2", away_team_code: "A4", home_score: null, away_score: null, group_code: "A", status: "UPCOMING", kickoff: "2026-06-03T12:00:00Z", minute: null, stage: "Group Stage - 3" },
      // m6: FINISHED with real scores — user has NO prediction for this match
      { id: "m6", home_team_code: "A3", away_team_code: "A4", home_score: 2, away_score: 0, group_code: "A", status: "FINISHED", kickoff: "2026-06-03T15:00:00Z", minute: null, stage: "Group Stage - 3" },
    ]
    // User predicted 5 of 6 matches; each as a draw (1-1) for simplicity
    const userPredictions = [
      { match_id: "m1", home_score: 1, away_score: 1 },
      { match_id: "m2", home_score: 1, away_score: 1 },
      { match_id: "m3", home_score: 1, away_score: 1 },
      { match_id: "m4", home_score: 1, away_score: 1 },
      { match_id: "m5", home_score: 1, away_score: 1 },
      // m6 intentionally missing
    ]

    const standingsRows = [
      { group_code: "A", team_code: "A1" },
      { group_code: "A", team_code: "A2" },
      { group_code: "A", team_code: "A3" },
      { group_code: "A", team_code: "A4" },
    ]

    const supabase = buildSupabase(groupAMatches, [], { standingsRows, predictions: userPredictions, userId: "user-gap" })
    const groups = await getStandingsByGroup(supabase as never, "user-gap")

    const groupA = groups.find((g) => g.id === "A")
    expect(groupA?.projectedRows).toBeDefined()
    expect(groupA?.projectedRows).toHaveLength(4)

    // After gap-fill: A3 wins m6 (2-0) so A3 earns 3 pts + 4 draw pts from m2+m3 = 7 pts total.
    // A4 loses m6 so A4 earns 0 pts from m6 + 4 draw pts from m4+m5 = 4 pts.
    // A3 must finish above A4 in projected standings.
    const a3Projected = groupA?.projectedRows?.find((r) => r.team === "A3")
    const a4Projected = groupA?.projectedRows?.find((r) => r.team === "A4")
    expect(a3Projected).toBeDefined()
    expect(a4Projected).toBeDefined()
    // A3 won m6 → more pts than A4
    expect(a3Projected!.pts).toBeGreaterThan(a4Projected!.pts)
  })

  it("projects PJ=3 per team when standings use api ids and matches have null group_code", async () => {
    const groupAMatches: MatchAggRow[] = [
      { id: "m1", home_team_code: "MEX", away_team_code: "KOR", home_score: null, away_score: null, group_code: null, status: "UPCOMING", kickoff: "2026-06-01T12:00:00Z", minute: null, stage: "Group Stage - 1" },
      { id: "m2", home_team_code: "RSA", away_team_code: "CZE", home_score: null, away_score: null, group_code: null, status: "UPCOMING", kickoff: "2026-06-02T12:00:00Z", minute: null, stage: "Group Stage - 1" },
      { id: "m3", home_team_code: "MEX", away_team_code: "RSA", home_score: null, away_score: null, group_code: null, status: "UPCOMING", kickoff: "2026-06-03T12:00:00Z", minute: null, stage: "Group Stage - 2" },
      { id: "m4", home_team_code: "KOR", away_team_code: "CZE", home_score: null, away_score: null, group_code: null, status: "UPCOMING", kickoff: "2026-06-04T12:00:00Z", minute: null, stage: "Group Stage - 2" },
      { id: "m5", home_team_code: "MEX", away_team_code: "CZE", home_score: null, away_score: null, group_code: null, status: "UPCOMING", kickoff: "2026-06-05T12:00:00Z", minute: null, stage: "Group Stage - 3" },
      { id: "m6", home_team_code: "KOR", away_team_code: "RSA", home_score: null, away_score: null, group_code: null, status: "UPCOMING", kickoff: "2026-06-06T12:00:00Z", minute: null, stage: "Group Stage - 3" },
    ]
    const teams = [
      { api_id: 16, code: "MEX", logo: null, name: "Mexico", c1: null, c2: null, c3: null },
      { api_id: 17, code: "KOR", logo: null, name: "Korea", c1: null, c2: null, c3: null },
      { api_id: 770, code: "CZE", logo: null, name: "Czechia", c1: null, c2: null, c3: null },
      { api_id: 1531, code: "RSA", logo: null, name: "South Africa", c1: null, c2: null, c3: null },
    ]
    const standingsRows = [
      { group_code: "Group A", team_code: "16" },
      { group_code: "Group A", team_code: "17" },
      { group_code: "Group A", team_code: "770" },
      { group_code: "Group A", team_code: "1531" },
    ]
    const predictions = groupAMatches.map((match, index) => ({
      match_id: match.id,
      home_score: index % 3,
      away_score: (index + 1) % 3,
    }))

    const supabase = buildSupabase(groupAMatches, teams, { standingsRows, predictions })
    const groups = await getStandingsByGroup(supabase as never, "user-1")

    const groupA = groups.find((group) => group.id === "A")
    expect(groupA?.projectedRows).toHaveLength(4)
    for (const row of groupA?.projectedRows ?? []) {
      expect(row.pj).toBe(3)
    }
  })
})
