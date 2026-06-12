import { describe, expect, it, vi } from "vitest"

// Must be mocked before importing so supabase config.ts doesn't throw at load time
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}))

import {
  computeMaxStreak,
  evalMatador,
  evalDeTaquito,
  evalJuegaDavid,
  evalFuaElDiego,
  evalLlegoALaSemi,
  evalLoVeiaVenir,
} from "@/lib/achievements/evaluate"

// ─── computeMaxStreak ─────────────────────────────────────────────────────────

describe("computeMaxStreak", () => {
  it("returns 0 for empty array", () => {
    expect(computeMaxStreak([])).toBe(0)
  })

  it("returns 0 when all misses", () => {
    expect(computeMaxStreak([false, false, false])).toBe(0)
  })

  it("returns length when all hits", () => {
    expect(computeMaxStreak([true, true, true, true])).toBe(4)
  })

  it("returns 1 for alternating pattern", () => {
    expect(computeMaxStreak([true, false, true, false, true])).toBe(1)
  })

  it("returns max consecutive run in the middle", () => {
    expect(computeMaxStreak([false, true, true, true, false, true, true])).toBe(3)
  })

  it("picks the longest of two streaks", () => {
    expect(computeMaxStreak([true, true, false, true, true, true])).toBe(3)
  })
})

// ─── Supabase mock helpers ────────────────────────────────────────────────────

type MockQueryResult = { data: unknown; error: null | { message: string } }

/**
 * Build a chainable Supabase mock where each `from(table)` call is intercepted
 * via a handler map. The handler receives the table name and returns a chain
 * that should be returned from `select(...)`.
 */
function buildChainableMock(handlers: Record<string, () => unknown>) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const handler = handlers[table]
      if (!handler) throw new Error(`Unexpected table: ${table}`)
      return {
        select: vi.fn().mockImplementation(() => handler()),
      }
    }),
  }
}

function buildChainedSelectMock(result: MockQueryResult) {
  return {
    in: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(result),
        not: vi.fn().mockReturnValue(result),
        order: vi.fn().mockReturnValue(result),
      }),
      not: vi.fn().mockReturnValue(result),
    }),
    eq: vi.fn().mockReturnValue({
      not: vi.fn().mockReturnValue(result),
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(result),
        lt: vi.fn().mockReturnValue(result),
      }),
    }),
    not: vi.fn().mockReturnValue(result),
  }
}

// ─── evalMatador ─────────────────────────────────────────────────────────────

const MATADOR_CATALOG = [
  {
    id: "matador",
    type: "progressive" as const,
    tiers: { bronze: 5, silver: 15, gold: 30 },
    points: { bronze: 10, silver: 25, gold: 50 },
  },
]

describe("evalMatador", () => {
  it("returns null when achievement not in catalog", async () => {
    const supabase = { from: vi.fn() } as unknown as Parameters<typeof evalMatador>[1]
    const result = await evalMatador("user-1", supabase, [])
    expect(result).toBeNull()
  })

  it("returns tier: null and current: 0 when no predictions", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof evalMatador>[1]

    const result = await evalMatador("user-1", supabase, MATADOR_CATALOG)
    expect(result?.tier).toBeNull()
    expect(result?.progress_json).toEqual({ current: 0 })
  })

  it("counts correct result predictions and returns bronze tier", async () => {
    const preds = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      match_id: `m${i}`,
      home_score: 1,
      away_score: 0,
      points: 3,
    }))

    const matches = preds.map((p) => ({
      id: p.match_id,
      home_score: 1,
      away_score: 0,
      status: "FINISHED",
    }))

    let callIndex = 0
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({ data: preds, error: null }),
              }),
            }),
          }
        }
        if (table === "matches") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: matches }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalMatador>[1]

    const result = await evalMatador("user-1", supabase, MATADOR_CATALOG)
    expect(result?.achievement_id).toBe("matador")
    expect(result?.tier).toBe("bronze")
    expect((result?.progress_json as { current: number })?.current).toBe(6)
  })

  it("does not count wrong predictions", async () => {
    const preds = [
      { id: "p1", match_id: "m1", home_score: 2, away_score: 0, points: 0 },
      { id: "p2", match_id: "m2", home_score: 1, away_score: 1, points: 0 },
    ]
    const matches = [
      { id: "m1", home_score: 0, away_score: 1, status: "FINISHED" },
      { id: "m2", home_score: 2, away_score: 0, status: "FINISHED" },
    ]

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({ data: preds, error: null }),
              }),
            }),
          }
        }
        if (table === "matches") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: matches }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalMatador>[1]

    const result = await evalMatador("user-1", supabase, MATADOR_CATALOG)
    expect(result?.tier).toBeNull()
    expect((result?.progress_json as { current: number })?.current).toBe(0)
  })
})

// ─── evalDeTaquito ────────────────────────────────────────────────────────────

const DE_TAQUITO_CATALOG = [
  {
    id: "de_taquito",
    type: "progressive" as const,
    tiers: { bronze: 1, silver: 5, gold: 10 },
    points: { bronze: 10, silver: 25, gold: 50 },
  },
]

describe("evalDeTaquito", () => {
  it("returns null when achievement not in catalog", async () => {
    const supabase = { from: vi.fn() } as unknown as Parameters<typeof evalDeTaquito>[1]
    expect(await evalDeTaquito("user-1", supabase, [])).toBeNull()
  })

  it("counts exact score predictions (home+away match)", async () => {
    const preds = [
      { id: "p1", match_id: "m1", home_score: 2, away_score: 1 }, // exact
      { id: "p2", match_id: "m2", home_score: 0, away_score: 0 }, // exact
      { id: "p3", match_id: "m3", home_score: 1, away_score: 0 }, // wrong
    ]
    const matches = [
      { id: "m1", home_score: 2, away_score: 1 },
      { id: "m2", home_score: 0, away_score: 0 },
      { id: "m3", home_score: 2, away_score: 0 }, // different score
    ]

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: preds, error: null }),
            }),
          }
        }
        if (table === "matches") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: matches }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalDeTaquito>[1]

    const result = await evalDeTaquito("user-1", supabase, DE_TAQUITO_CATALOG)
    expect(result?.achievement_id).toBe("de_taquito")
    // bronze=1, silver=5, gold=10 — 2 exact predictions → bronze tier
    expect(result?.tier).toBe("bronze")
    expect((result?.progress_json as { current: number })?.current).toBe(2)
  })

  it("returns tier: null when no exact predictions", async () => {
    const preds = [{ id: "p1", match_id: "m1", home_score: 1, away_score: 0 }]
    const matches = [{ id: "m1", home_score: 2, away_score: 1 }]

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: preds, error: null }),
            }),
          }
        }
        if (table === "matches") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: matches }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalDeTaquito>[1]

    const result = await evalDeTaquito("user-1", supabase, DE_TAQUITO_CATALOG)
    expect(result?.tier).toBeNull()
    expect((result?.progress_json as { current: number })?.current).toBe(0)
  })
})

// ─── evalJuegaDavid ───────────────────────────────────────────────────────────

const JUEGA_DAVID_CATALOG = [
  {
    id: "juega_david",
    type: "progressive" as const,
    tiers: { bronze: 1, silver: 3, gold: 5 },
    points: { bronze: 20, silver: 40, gold: 75 },
  },
]

describe("evalJuegaDavid", () => {
  // Real data shape: matches.group_code is NULL and stage is "Group Stage - N".
  // Team→group must come from the standings table.
  function buildDavidSupabase({
    preds,
    userMatches,
    allGroupMatches,
    standings,
    teams,
  }: {
    preds: Array<{ id: string; match_id: string; home_score: number; away_score: number }>
    userMatches: unknown[]
    allGroupMatches: unknown[]
    standings: Array<{ group_code: string; team_code: string }>
    teams: Array<{ api_id: number | null; code: string }>
  }) {
    let matchesCall = 0
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: preds, error: null }) }) }
        }
        if (table === "matches") {
          matchesCall++
          if (matchesCall === 1) {
            // user's predicted matches: .in().eq(status).ilike(stage)
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    ilike: vi.fn().mockResolvedValue({ data: userMatches, error: null }),
                  }),
                }),
              }),
            }
          }
          // all finished group-stage matches: .eq(status).ilike(stage)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockResolvedValue({ data: allGroupMatches, error: null }),
              }),
            }),
          }
        }
        if (table === "standings") {
          return { select: vi.fn().mockResolvedValue({ data: standings, error: null }) }
        }
        if (table === "teams") {
          return { select: vi.fn().mockResolvedValue({ data: teams, error: null }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalJuegaDavid>[1]
  }

  const GROUP_A_STANDINGS = [
    { group_code: "Group A", team_code: "ARG" },
    { group_code: "Group A", team_code: "BRZ" },
    { group_code: "Group A", team_code: "CHI" },
    { group_code: "Group A", team_code: "ECU" },
  ]
  const GROUP_A_TEAMS = [
    { api_id: 1, code: "ARG" },
    { api_id: 2, code: "BRZ" },
    { api_id: 3, code: "CHI" },
    { api_id: 4, code: "ECU" },
  ]

  it("returns null when achievement not in catalog", async () => {
    const supabase = { from: vi.fn() } as unknown as Parameters<typeof evalJuegaDavid>[1]
    expect(await evalJuegaDavid("user-1", supabase, [])).toBeNull()
  })

  it("counts an upset on real data where group_code is null and groups come from standings", async () => {
    // BRZ leads (won earlier), ARG trails (lost earlier). User predicted ARG beats BRZ; ARG wins → upset.
    const preds = [{ id: "p1", match_id: "m1", home_score: 1, away_score: 0 }]
    const userMatches = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRZ", home_score: 1, away_score: 0, kickoff: "2026-06-15T18:00:00Z" },
    ]
    const allGroupMatches = [
      { id: "pm1", home_team_code: "BRZ", away_team_code: "CHI", home_score: 3, away_score: 0, kickoff: "2026-06-10T15:00:00Z" },
      { id: "pm2", home_team_code: "ECU", away_team_code: "ARG", home_score: 2, away_score: 0, kickoff: "2026-06-10T12:00:00Z" },
      ...userMatches,
    ]

    const supabase = buildDavidSupabase({
      preds,
      userMatches,
      allGroupMatches,
      standings: GROUP_A_STANDINGS,
      teams: GROUP_A_TEAMS,
    })

    const result = await evalJuegaDavid("user-1", supabase, JUEGA_DAVID_CATALOG)
    expect(result?.tier).toBe("bronze")
    expect((result?.progress_json as { current: number })?.current).toBe(1)
  })

  it("does not count when the favorite wins as predicted", async () => {
    const preds = [{ id: "p1", match_id: "m1", home_score: 0, away_score: 1 }]
    const userMatches = [
      { id: "m1", home_team_code: "ARG", away_team_code: "BRZ", home_score: 0, away_score: 2, kickoff: "2026-06-15T18:00:00Z" },
    ]
    const allGroupMatches = [
      { id: "pm1", home_team_code: "BRZ", away_team_code: "CHI", home_score: 3, away_score: 0, kickoff: "2026-06-10T15:00:00Z" },
      { id: "pm2", home_team_code: "ECU", away_team_code: "ARG", home_score: 2, away_score: 0, kickoff: "2026-06-10T12:00:00Z" },
      ...userMatches,
    ]

    const supabase = buildDavidSupabase({
      preds,
      userMatches,
      allGroupMatches,
      standings: GROUP_A_STANDINGS,
      teams: GROUP_A_TEAMS,
    })

    const result = await evalJuegaDavid("user-1", supabase, JUEGA_DAVID_CATALOG)
    expect(result?.tier).toBeNull()
    expect((result?.progress_json as { current: number })?.current).toBe(0)
  })
})

// ─── evalLlegoALaSemi / evalLoVeiaVenir — strict stage-value mocks ───────────
// These mocks only return data when the query carries the REAL stage string,
// so a wrong literal (the bug class) fails the test instead of hiding.

describe("evalLlegoALaSemi", () => {
  function buildSemiSupabase(picks: Array<{ team_code: string }>, semiMatches: unknown[]) {
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "bracket_picks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: picks, error: null }),
              }),
            }),
          }
        }
        if (table === "matches") {
          let stageValue: string | null = null
          const capture = (col: string, val: string) => {
            if (col === "stage") stageValue = val
          }
          const secondEq = vi.fn((col: string, val: string) => {
            capture(col, val)
            return Promise.resolve({ data: stageValue === "Semi-finals" ? semiMatches : [], error: null })
          })
          const firstEq = vi.fn((col: string, val: string) => {
            capture(col, val)
            return { eq: secondEq }
          })
          return { select: vi.fn().mockReturnValue({ eq: firstEq }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalLlegoALaSemi>[1]
  }

  it("awards when all four semifinal picks reached the real semis", async () => {
    const picks = [{ team_code: "ARG" }, { team_code: "FRA" }, { team_code: "BRZ" }, { team_code: "ESP" }]
    const semiMatches = [
      { home_team_code: "ARG", away_team_code: "FRA" },
      { home_team_code: "BRZ", away_team_code: "ESP" },
    ]
    const result = await evalLlegoALaSemi("user-1", buildSemiSupabase(picks, semiMatches))
    expect(result?.achievement_id).toBe("llego_a_la_semi")
  })

  it("returns null when a pick missed the semis", async () => {
    const picks = [{ team_code: "ARG" }, { team_code: "FRA" }, { team_code: "BRZ" }, { team_code: "GER" }]
    const semiMatches = [
      { home_team_code: "ARG", away_team_code: "FRA" },
      { home_team_code: "BRZ", away_team_code: "ESP" },
    ]
    expect(await evalLlegoALaSemi("user-1", buildSemiSupabase(picks, semiMatches))).toBeNull()
  })
})

describe("evalLoVeiaVenir", () => {
  function buildFinalSupabase(championCode: string | null, finalMatch: unknown) {
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "tournament_predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: championCode ? { champion_code: championCode } : null,
                }),
              }),
            }),
          }
        }
        if (table === "matches") {
          let stageOk = false
          const chain = {
            in: vi.fn((col: string, vals: string[]) => {
              if (col === "stage" && vals.includes("Final")) stageOk = true
              return chain
            }),
            eq: vi.fn(() => chain),
            maybeSingle: vi.fn(async () => ({ data: stageOk ? finalMatch : null })),
          }
          return { select: vi.fn().mockReturnValue(chain) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalLoVeiaVenir>[1]
  }

  it("awards when the predicted champion wins the real final", async () => {
    const result = await evalLoVeiaVenir(
      "user-1",
      buildFinalSupabase("ARG", { home_team_code: "ARG", away_team_code: "FRA", home_score: 3, away_score: 1 })
    )
    expect(result?.achievement_id).toBe("lo_veia_venir")
  })

  it("returns null when another team is champion", async () => {
    expect(
      await evalLoVeiaVenir(
        "user-1",
        buildFinalSupabase("BRZ", { home_team_code: "ARG", away_team_code: "FRA", home_score: 3, away_score: 1 })
      )
    ).toBeNull()
  })
})

// ─── evalFuaElDiego ───────────────────────────────────────────────────────────

describe("evalFuaElDiego", () => {
  function buildFuaSupabase({
    total,
    finished,
    preds,
    matches,
  }: {
    total: number
    finished: number
    preds: Array<{ id: string; match_id: string; home_score: number; away_score: number; points: number }>
    matches: Array<{ id: string; home_score: number; away_score: number }>
  }) {
    let matchesCountCall = 0
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "matches") {
          matchesCountCall++
          if (matchesCountCall === 1) {
            // Total matches count
            return {
              select: vi.fn().mockReturnValue({
                count: total,
                error: null,
              }),
            }
          }
          if (matchesCountCall === 2) {
            // Finished matches count
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({ count: finished, error: null }),
              }),
            }
          }
          // Third call: matches for user predictions (in + eq)
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: matches }),
              }),
            }),
          }
        }
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({ data: preds, error: null }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalFuaElDiego>[1]
  }

  it("returns null when not all matches are finished", async () => {
    const supabase = buildFuaSupabase({ total: 64, finished: 32, preds: [], matches: [] })
    expect(await evalFuaElDiego("user-1", supabase)).toBeNull()
  })

  it("returns null when accuracy is below 70%", async () => {
    const preds = [
      { id: "p1", match_id: "m1", home_score: 1, away_score: 0, points: 0 },
      { id: "p2", match_id: "m2", home_score: 1, away_score: 0, points: 0 },
      { id: "p3", match_id: "m3", home_score: 1, away_score: 0, points: 3 },
    ]
    const matches = [
      { id: "m1", home_score: 0, away_score: 1 }, // wrong
      { id: "m2", home_score: 0, away_score: 1 }, // wrong
      { id: "m3", home_score: 1, away_score: 0 }, // correct
    ]
    const supabase = buildFuaSupabase({ total: 3, finished: 3, preds, matches })
    expect(await evalFuaElDiego("user-1", supabase)).toBeNull()
  })

  it("returns achievement when accuracy >= 70%", async () => {
    // 3/3 correct = 100%
    const preds = [
      { id: "p1", match_id: "m1", home_score: 1, away_score: 0, points: 3 },
      { id: "p2", match_id: "m2", home_score: 0, away_score: 1, points: 3 },
      { id: "p3", match_id: "m3", home_score: 0, away_score: 0, points: 3 },
    ]
    const matches = [
      { id: "m1", home_score: 1, away_score: 0 },
      { id: "m2", home_score: 0, away_score: 1 },
      { id: "m3", home_score: 0, away_score: 0 },
    ]
    const supabase = buildFuaSupabase({ total: 3, finished: 3, preds, matches })
    const result = await evalFuaElDiego("user-1", supabase)
    expect(result?.achievement_id).toBe("fua_el_diego")
    expect((result?.progress_json as { accuracy: number })?.accuracy).toBe(1)
  })

  it("returns achievement at exactly 70% accuracy", async () => {
    // 7/10 correct
    const preds = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      match_id: `m${i}`,
      home_score: 1,
      away_score: 0,
      points: i < 7 ? 3 : 0,
    }))
    const matches = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      home_score: i < 7 ? 1 : 0,
      away_score: i < 7 ? 0 : 1,
    }))
    const supabase = buildFuaSupabase({ total: 10, finished: 10, preds, matches })
    const result = await evalFuaElDiego("user-1", supabase)
    expect(result?.achievement_id).toBe("fua_el_diego")
    expect((result?.progress_json as { accuracy: number })?.accuracy).toBeCloseTo(0.7)
  })
})

// ─── evalEsElNine ─────────────────────────────────────────────────────────────

import { evalEsElNine } from "@/lib/achievements/evaluate"

function buildNineSupabase({
  pick,
  finalFinished,
  events,
}: {
  pick: number | null
  finalFinished: boolean
  events: Array<{ player_api_id: number }>
}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "tournament_predictions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: pick ? { top_scorer_api_id: pick } : null,
              }),
            }),
          }),
        }
      }
      if (table === "matches") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: finalFinished ? { id: "final-match" } : null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === "match_events") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: events, error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  } as unknown as Parameters<typeof evalEsElNine>[1]
}

describe("evalEsElNine", () => {
  it("never awards while the final has not been played, even if the pick currently leads", async () => {
    const supabase = buildNineSupabase({
      pick: 9,
      finalFinished: false,
      events: [{ player_api_id: 9 }, { player_api_id: 9 }],
    })
    expect(await evalEsElNine("user-1", supabase)).toBeNull()
  })

  it("awards after the final when the pick is the outright top scorer", async () => {
    const supabase = buildNineSupabase({
      pick: 9,
      finalFinished: true,
      events: [{ player_api_id: 7 }, { player_api_id: 9 }, { player_api_id: 9 }],
    })
    const result = await evalEsElNine("user-1", supabase)
    expect(result?.achievement_id).toBe("es_el_nine")
  })

  it("awards when the pick is among tied top scorers", async () => {
    // Player 7's goals come FIRST so a naive sort[0] would pick 7, not 9
    const supabase = buildNineSupabase({
      pick: 9,
      finalFinished: true,
      events: [
        { player_api_id: 7 },
        { player_api_id: 7 },
        { player_api_id: 9 },
        { player_api_id: 9 },
      ],
    })
    const result = await evalEsElNine("user-1", supabase)
    expect(result?.achievement_id).toBe("es_el_nine")
  })

  it("does not award when another player is the top scorer", async () => {
    const supabase = buildNineSupabase({
      pick: 9,
      finalFinished: true,
      events: [{ player_api_id: 7 }, { player_api_id: 7 }, { player_api_id: 9 }],
    })
    expect(await evalEsElNine("user-1", supabase)).toBeNull()
  })
})
