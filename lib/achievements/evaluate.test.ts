import { describe, expect, it, vi } from "vitest"
import { evalArrancamos, evalJuegaDavid } from "@/lib/achievements/evaluate"

type TournamentRow = {
  top_scorer_api_id: number | null
  best_player_api_id: number | null
  best_young_player_api_id: number | null
}

function buildSupabase(row: TournamentRow | null, error: unknown = null) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  }
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    }),
  } as unknown as ReturnType<typeof import("@/lib/supabase/service").createServiceClient>
}

const fullAwards: TournamentRow = {
  top_scorer_api_id: 1,
  best_player_api_id: 2,
  best_young_player_api_id: 3,
}

describe("evalArrancamos", () => {
  it("returns bronze when all 3 awards are filled", async () => {
    const result = await evalArrancamos("user-1", buildSupabase(fullAwards))
    expect(result).toEqual({ achievement_id: "arrancamos", tier: "bronze", progress_json: null })
  })

  it("returns null when top_scorer_api_id is missing", async () => {
    const result = await evalArrancamos("user-1", buildSupabase({ ...fullAwards, top_scorer_api_id: null }))
    expect(result).toBeNull()
  })

  it("returns null when best_player_api_id is missing", async () => {
    const result = await evalArrancamos("user-1", buildSupabase({ ...fullAwards, best_player_api_id: null }))
    expect(result).toBeNull()
  })

  it("returns null when best_young_player_api_id is missing", async () => {
    const result = await evalArrancamos("user-1", buildSupabase({ ...fullAwards, best_young_player_api_id: null }))
    expect(result).toBeNull()
  })

  it("returns null when tournament_predictions row not found", async () => {
    const result = await evalArrancamos("user-1", buildSupabase(null))
    expect(result).toBeNull()
  })

  it("returns null on database error", async () => {
    const result = await evalArrancamos("user-1", buildSupabase(null, { message: "db error" }))
    expect(result).toBeNull()
  })
})

// ─── evalJuegaDavid (new API-predictions mechanic) ──────────────────────────

type PredRow = { id: string; home_score: number; away_score: number; match_id: string }
type MatchRow = {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
}
type MpRow = { match_id: string; home_pct: number; away_pct: number }

const CATALOG = [
  {
    id: "juega_david",
    type: "progressive" as const,
    tiers: { bronze: 1, silver: 3, gold: 6 },
    points: { bronze: 5, silver: 15, gold: 30 },
  },
]

/**
 * Strict-mock Supabase builder for evalJuegaDavid.
 *
 * Each .from() call returns a fresh chain that resolves to the appropriate data.
 * The match_predictions chain only returns rows whose match_id is in the .in() filter.
 * This is the strict-mock convention: data only returned for real filter values.
 */
function buildJuegaDavidSupabase(
  predRows: PredRow[],
  matchRows: MatchRow[],
  mpRows: MpRow[],
): ReturnType<typeof import("@/lib/supabase/service").createServiceClient> {
  function makeChain(resolver: (inFilter: string[]) => unknown) {
    const capturedIn: string[] = []
    const chain: Record<string, unknown> = {
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn((_col: string, vals: string[]) => {
        capturedIn.push(...vals)
        return chain
      }),
    }
    // Make thenable
    Object.defineProperty(chain, "then", {
      get: () => (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
        try {
          resolve(resolver(capturedIn))
        } catch (e) {
          reject(e)
        }
      },
    })
    return chain
  }

  return {
    from: vi.fn((table: string) => {
      if (table === "predictions") {
        return makeChain(() => ({ data: predRows, error: null }))
      }
      if (table === "matches") {
        return makeChain((ids) => ({
          data: ids.length > 0 ? matchRows.filter((m) => ids.includes(m.id)) : matchRows,
          error: null,
        }))
      }
      if (table === "match_predictions") {
        // STRICT: only return rows whose match_id is in the filter
        return makeChain((ids) => ({
          data: ids.length === 0 ? [] : mpRows.filter((r) => ids.includes(r.match_id)),
          error: null,
        }))
      }
      return makeChain(() => ({ data: [], error: null }))
    }),
  } as unknown as ReturnType<typeof import("@/lib/supabase/service").createServiceClient>
}

describe("evalJuegaDavid", () => {
  it("is enabled and awards bronze when user called an upset (away favorite, home wins)", async () => {
    // home_pct=35, away_pct=65 → away is API favorite; user predicts home win; home wins → upset
    const preds: PredRow[] = [{ id: "p1", home_score: 2, away_score: 0, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 2, away_score: 0 },
    ]
    const mp: MpRow[] = [{ match_id: "m1", home_pct: 35, away_pct: 65 }]
    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result?.tier).toBe("bronze")
    expect((result?.progress_json as { current: number })?.current).toBe(1)
  })
})

describe("evalJuegaDavid — new API-predictions mechanic", () => {
  it("returns null when achievement not in catalog", async () => {
    const sb = buildJuegaDavidSupabase([], [], [])
    const result = await evalJuegaDavid("u1", sb, [])
    expect(result).toBeNull()
  })

  it("returns tier:null progress 0 when user has no predictions", async () => {
    const sb = buildJuegaDavidSupabase([], [], [])
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: null,
      progress_json: { current: 0 },
    })
  })

  it("counts upset when user picked underdog and it won (away favorite, home wins)", async () => {
    // home_pct=35, away_pct=65 → away is API favorite
    // user predicted home win (home_score=2, away_score=0)
    // actual: home wins → upset
    const preds: PredRow[] = [{ id: "p1", home_score: 2, away_score: 0, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 2, away_score: 0 },
    ]
    const mp: MpRow[] = [{ match_id: "m1", home_pct: 35, away_pct: 65 }]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: "bronze",
      progress_json: { current: 1 },
    })
  })

  it("does NOT count upset when user picked the favorite and it won", async () => {
    // home_pct=65, away_pct=35 → home is API favorite
    // user predicted home win, home wins → no upset
    const preds: PredRow[] = [{ id: "p1", home_score: 1, away_score: 0, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 1, away_score: 0 },
    ]
    const mp: MpRow[] = [{ match_id: "m1", home_pct: 65, away_pct: 35 }]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: null,
      progress_json: { current: 0 },
    })
  })

  it("skips match when home_pct === away_pct (no clear favorite)", async () => {
    const preds: PredRow[] = [{ id: "p1", home_score: 2, away_score: 0, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 2, away_score: 0 },
    ]
    const mp: MpRow[] = [{ match_id: "m1", home_pct: 50, away_pct: 50 }]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: null,
      progress_json: { current: 0 },
    })
  })

  it("skips match when no match_predictions row exists (strict mock returns empty)", async () => {
    const preds: PredRow[] = [{ id: "p1", home_score: 2, away_score: 0, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 2, away_score: 0 },
    ]
    const mp: MpRow[] = [] // no row for m1

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: null,
      progress_json: { current: 0 },
    })
  })

  it("draw result never counts as upset", async () => {
    const preds: PredRow[] = [{ id: "p1", home_score: 1, away_score: 1, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 1, away_score: 1 },
    ]
    const mp: MpRow[] = [{ match_id: "m1", home_pct: 40, away_pct: 60 }]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: null,
      progress_json: { current: 0 },
    })
  })

  it("predicted draw never counts as upset", async () => {
    // user predicted draw — even if actual away wins → skip (draw prediction = null winner)
    const preds: PredRow[] = [{ id: "p1", home_score: 1, away_score: 1, match_id: "m1" }]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 0, away_score: 2 },
    ]
    const mp: MpRow[] = [{ match_id: "m1", home_pct: 60, away_pct: 40 }]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: null,
      progress_json: { current: 0 },
    })
  })

  it("counts multiple upsets across multiple matches", async () => {
    // m1: away favorite (30/70), user picks home, home wins → upset
    // m2: home favorite (65/35), user picks away, away wins → upset
    // m3: home favorite (80/20), user picks home, home wins → no upset
    const preds: PredRow[] = [
      { id: "p1", home_score: 1, away_score: 0, match_id: "m1" },
      { id: "p2", home_score: 0, away_score: 1, match_id: "m2" },
      { id: "p3", home_score: 2, away_score: 0, match_id: "m3" },
    ]
    const matches: MatchRow[] = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRA", home_score: 1, away_score: 0 },
      { id: "m2", home_team_code: "FRA", away_team_code: "GER", home_score: 0, away_score: 1 },
      { id: "m3", home_team_code: "ESP", away_team_code: "ITA", home_score: 2, away_score: 0 },
    ]
    const mp: MpRow[] = [
      { match_id: "m1", home_pct: 30, away_pct: 70 },
      { match_id: "m2", home_pct: 65, away_pct: 35 },
      { match_id: "m3", home_pct: 80, away_pct: 20 },
    ]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: "bronze",
      progress_json: { current: 2 },
    })
  })

  it("counts upsets at any match stage, not limited to group stage", async () => {
    // Verifies old .ilike('stage','Group Stage%') filter is gone
    const preds: PredRow[] = [{ id: "p1", home_score: 1, away_score: 0, match_id: "sf1" }]
    const matches: MatchRow[] = [
      { id: "sf1", home_team_code: "ARG", away_team_code: "BRA", home_score: 1, away_score: 0 },
    ]
    const mp: MpRow[] = [{ match_id: "sf1", home_pct: 25, away_pct: 75 }]

    const sb = buildJuegaDavidSupabase(preds, matches, mp)
    const result = await evalJuegaDavid("u1", sb, CATALOG)
    expect(result).toEqual({
      achievement_id: "juega_david",
      tier: "bronze",
      progress_json: { current: 1 },
    })
  })
})
