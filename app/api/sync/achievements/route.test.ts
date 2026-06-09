import { describe, expect, it, vi } from "vitest"

// Must be mocked before importing route so supabase config.ts doesn't throw at load time
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}))

import {
  computeMaxStreak,
  evalMatador,
  evalDeTaquito,
  evalJuegaDavid,
  evalFuaElDiego,
} from "@/app/api/sync/achievements/route"

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
  it("returns null when achievement not in catalog", async () => {
    const supabase = { from: vi.fn() } as unknown as Parameters<typeof evalJuegaDavid>[1]
    expect(await evalJuegaDavid("user-1", supabase, [])).toBeNull()
  })

  it("returns progress 0 when no predictions", async () => {
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalJuegaDavid>[1]

    const result = await evalJuegaDavid("user-1", supabase, JUEGA_DAVID_CATALOG)
    expect(result?.tier).toBeNull()
    expect((result?.progress_json as { current: number })?.current).toBe(0)
  })

  it("counts upset prediction correctly (underdog team predicted + won)", async () => {
    // Match: ARG vs BRZ. BRZ is pre-match favorite (more pts).
    // User predicted ARG wins. ARG actually wins → upset correctly predicted.
    const preds = [
      { id: "p1", match_id: "m1", home_score: 1, away_score: 0 }, // predicted ARG (home) wins
    ]
    const groupMatches = [
      {
        id: "m1",
        home_team_code: "ARG",
        away_team_code: "BRZ",
        home_score: 1,
        away_score: 0,
        group_code: "Group A",
        kickoff: "2026-06-15T18:00:00Z",
        status: "FINISHED",
        stage: "GROUP",
      },
    ]
    // Prior matches (before m1): BRZ beat CHI 3-0, ARG lost 0-2
    const priorGroupMatches = [
      {
        id: "pm1",
        home_team_code: "BRZ",
        away_team_code: "CHI",
        home_score: 3,
        away_score: 0,
        kickoff: "2026-06-10T15:00:00Z",
      },
      {
        id: "pm2",
        home_team_code: "ECU",
        away_team_code: "ARG",
        home_score: 2,
        away_score: 0,
        kickoff: "2026-06-10T12:00:00Z",
      },
    ]
    // Dynamic standings: BRZ=3pts, ECU=3pts, ARG=0pts, CHI=0pts → ARG is underdog (idx>=2)
    // ARG (home) wins m1 → ARG is actualWinner, ARG is underdog → upset
    // User predicted home (ARG) wins → upsetCount++

    let priorMatchesCalled = false
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: preds, error: null }),
            }),
          }
        }
        if (table === "standings") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }
        }
        if (table === "matches") {
          if (!priorMatchesCalled) {
            // First matches call: user's group stage FINISHED matches
            priorMatchesCalled = true
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: groupMatches, error: null }),
                  }),
                }),
              }),
            }
          }
          // Subsequent matches calls: prior matches for dynamic standings
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lt: vi.fn().mockResolvedValue({ data: priorGroupMatches }),
                }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalJuegaDavid>[1]

    const result = await evalJuegaDavid("user-1", supabase, JUEGA_DAVID_CATALOG)
    expect(result?.achievement_id).toBe("juega_david")
    expect(result?.tier).toBe("bronze") // 1 upset ≥ bronze threshold
    expect((result?.progress_json as { current: number })?.current).toBe(1)
  })

  it("does not count when favorite wins as predicted", async () => {
    // BRZ is favorite and wins; user predicted BRZ → not an upset pick
    const preds = [
      { id: "p1", match_id: "m1", home_score: 0, away_score: 1 }, // predicted BRZ (away) wins
    ]
    const groupMatches = [
      {
        id: "m1",
        home_team_code: "ARG",
        away_team_code: "BRZ",
        home_score: 0,
        away_score: 2,
        group_code: "Group A",
        kickoff: "2026-06-15T18:00:00Z",
        status: "FINISHED",
        stage: "GROUP",
      },
    ]
    // Prior matches: BRZ leads, ARG trails
    const priorGroupMatches = [
      { id: "pm1", home_team_code: "BRZ", away_team_code: "CHI", home_score: 3, away_score: 0, kickoff: "2026-06-10T15:00:00Z" },
      { id: "pm2", home_team_code: "ECU", away_team_code: "ARG", home_score: 2, away_score: 0, kickoff: "2026-06-10T12:00:00Z" },
    ]

    let firstMatchCall = true
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "predictions") {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: preds, error: null }) }) }
        }
        if (table === "standings") {
          return { select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [] }) }) }
        }
        if (table === "matches") {
          if (firstMatchCall) {
            firstMatchCall = false
            return { select: vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: groupMatches, error: null }) }) }) }) }
          }
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ lt: vi.fn().mockResolvedValue({ data: priorGroupMatches }) }) }) }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as Parameters<typeof evalJuegaDavid>[1]

    const result = await evalJuegaDavid("user-1", supabase, JUEGA_DAVID_CATALOG)
    // BRZ is favorite (3pts vs ARG 0pts) and wins. Not an upset — upsetCount stays 0
    expect(result?.tier).toBeNull()
    expect((result?.progress_json as { current: number })?.current).toBe(0)
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
