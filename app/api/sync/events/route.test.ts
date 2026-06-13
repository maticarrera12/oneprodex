import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  fetchMatchEvents: vi.fn(),
  evaluateAllUsers: vi.fn(),
  scoreBracketForMatch: vi.fn(),
}))

// applyWorldCupSeasonKickoffFilter chains .gte/.lt — pass through in tests;
// the filter itself is covered by lib/world-cup/season.test.ts
vi.mock("@/lib/world-cup/season", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/world-cup/season")>()
  return { ...actual, applyWorldCupSeasonKickoffFilter: (query: unknown) => query }
})

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock("@/lib/api-football/client", () => ({
  fetchMatchEvents: mocks.fetchMatchEvents,
}))

vi.mock("@/lib/achievements/evaluate", () => ({
  evaluateAllUsers: mocks.evaluateAllUsers,
}))

vi.mock("@/features/scoring/sync-bracket", () => ({
  scoreBracketForMatch: mocks.scoreBracketForMatch,
}))

import { POST } from "@/app/api/sync/events/route"

type QueryResult = { data: unknown; error: { message: string } | null }

function chainResolving(result: QueryResult) {
  const chain: Record<string, unknown> = {
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  for (const method of ["select", "eq", "or", "not", "in", "order"]) {
    chain[method] = vi.fn(() => chain)
  }
  return chain as { or: ReturnType<typeof vi.fn> } & Record<string, unknown>
}

const FINISHED_MATCH = {
  id: "m1",
  status: "FINISHED",
  home_score: 2,
  away_score: 1,
  home_team_code: "ARG",
  away_team_code: "MEX",
  kickoff: "2026-06-11T18:00:00+00:00",
  stage: "Group Stage - 1",
  scored_at: null,
}

function buildService({
  finishedMatches = [],
  predictions = [],
  matchEvents = [],
  playerPreds = [],
  cleanSheets = [],
  matchPrediction = null,
  predictionsUpdateError = null,
}: {
  finishedMatches?: unknown[]
  predictions?: unknown[]
  matchEvents?: unknown[]
  playerPreds?: unknown[]
  cleanSheets?: unknown[]
  matchPrediction?: { home_pct: number; away_pct: number } | null
  predictionsUpdateError?: { message: string } | null
} = {}) {
  const matchesSelectChain = chainResolving({ data: finishedMatches, error: null })
  const matchesUpdateChain = chainResolving({ data: null, error: null })
  const predictionsUpdateChain = chainResolving({ data: null, error: predictionsUpdateError })

  const matchesUpdate = vi.fn(() => matchesUpdateChain)
  const predictionsUpdate = vi.fn(() => predictionsUpdateChain)

  const service = {
    from: vi.fn((table: string) => {
      if (table === "matches") return { select: vi.fn(() => matchesSelectChain), update: matchesUpdate }
      if (table === "teams") return { select: vi.fn(() => chainResolving({ data: [], error: null })) }
      if (table === "predictions")
        return { select: vi.fn(() => chainResolving({ data: predictions, error: null })), update: predictionsUpdate }
      if (table === "match_events")
        return {
          select: vi.fn(() => chainResolving({ data: matchEvents, error: null })),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      if (table === "prediction_players")
        return { select: vi.fn(() => chainResolving({ data: playerPreds, error: null })) }
      if (table === "prediction_clean_sheets")
        return { select: vi.fn(() => chainResolving({ data: cleanSheets, error: null })) }
      if (table === "match_predictions")
        return { select: vi.fn(() => chainResolving({ data: matchPrediction, error: null })) }
      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  mocks.createServiceClient.mockReturnValue(service)
  return { service, matchesSelectChain, matchesUpdate, predictionsUpdate }
}

function syncRequest() {
  return new Request("http://localhost/api/sync/events", {
    method: "POST",
    headers: { authorization: "Bearer test-secret" },
  })
}

describe("POST /api/sync/events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SYNC_SECRET = "test-secret"
    mocks.fetchMatchEvents.mockResolvedValue({ data: { response: [] } })
    mocks.evaluateAllUsers.mockResolvedValue(undefined)
    mocks.scoreBracketForMatch.mockResolvedValue(0)
  })

  it("rejects requests without the sync secret", async () => {
    buildService()
    const response = await POST(new Request("http://localhost/api/sync/events", { method: "POST" }))
    expect(response.status).toBe(401)
  })

  it("only targets finished matches that are unscored or recently kicked off", async () => {
    const { matchesSelectChain } = buildService()

    await POST(syncRequest())

    expect(matchesSelectChain.or).toHaveBeenCalledTimes(1)
    const filter = String(matchesSelectChain.or.mock.calls[0]?.[0])
    expect(filter).toContain("scored_at.is.null")
    expect(filter).toMatch(/kickoff\.gte\./)
  })

  it("marks the match as scored after a successful run", async () => {
    const { matchesUpdate } = buildService({
      finishedMatches: [FINISHED_MATCH],
      predictions: [{ id: "p1", user_id: "u1", home_score: 2, away_score: 1 }],
    })

    const response = await POST(syncRequest())
    const payload = (await response.json()) as { updated: number; failed: number }

    expect(matchesUpdate).toHaveBeenCalledWith({ scored_at: expect.any(String) })
    expect(payload).toEqual({ updated: 1, failed: 0 })
  })

  it("does not mark scored_at when a points update fails, so the next run retries", async () => {
    const { matchesUpdate } = buildService({
      finishedMatches: [FINISHED_MATCH],
      predictions: [{ id: "p1", user_id: "u1", home_score: 2, away_score: 1 }],
      predictionsUpdateError: { message: "boom" },
    })

    const response = await POST(syncRequest())
    const payload = (await response.json()) as { updated: number; failed: number }

    expect(matchesUpdate).not.toHaveBeenCalled()
    expect(payload).toEqual({ updated: 0, failed: 1 })
  })

  it("skips the achievements pass when no match needed scoring", async () => {
    buildService({ finishedMatches: [] })

    await POST(syncRequest())

    expect(mocks.evaluateAllUsers).not.toHaveBeenCalled()
  })

  it("runs the achievements pass once after scoring", async () => {
    buildService({
      finishedMatches: [FINISHED_MATCH],
      predictions: [{ id: "p1", user_id: "u1", home_score: 2, away_score: 1 }],
    })

    await POST(syncRequest())

    expect(mocks.evaluateAllUsers).toHaveBeenCalledTimes(1)
  })

  it("computes exact score plus scorer points for the right user", async () => {
    const { predictionsUpdate } = buildService({
      finishedMatches: [FINISHED_MATCH],
      predictions: [
        { id: "p1", user_id: "u1", home_score: 2, away_score: 1 },
        { id: "p2", user_id: "u2", home_score: 0, away_score: 0 },
      ],
      matchEvents: [{ player_api_id: 10, type: "GOAL", team_code: "ARG" }],
      playerPreds: [{ user_id: "u1", player_api_id: 10, type: "SCORER" }],
    })

    await POST(syncRequest())

    // u1: exact (50) + scorer (16) = 66 · u2: nothing = 0
    expect(predictionsUpdate).toHaveBeenCalledWith({ points: 66 })
    expect(predictionsUpdate).toHaveBeenCalledWith({ points: 0 })
  })

  // USA-PAR shaped: home=46, draw=29, away=25 — gap=21 >= 15 → eligible
  // Away wins, user predicted away (0-1) → upset bonus applies
  it("USA-PAR regression: away underdog wins with gap>=15, user called it → upset bonus added", async () => {
    const usaParMatch = {
      ...FINISHED_MATCH,
      home_score: 0,
      away_score: 1,
      home_team_code: "USA",
      away_team_code: "PAR",
    }
    const { predictionsUpdate } = buildService({
      finishedMatches: [usaParMatch],
      predictions: [{ id: "p1", user_id: "u1", home_score: 0, away_score: 1 }],
      matchPrediction: { home_pct: 46, away_pct: 25 },
    })

    await POST(syncRequest())

    // base: exact score (user predicted 0-1, match ended 0-1) = 50
    // upsetBonus = calcUpsetBonus(25) = round(25 * 0.75) = 19
    // total = 50 + 19 = 69
    const calls = predictionsUpdate.mock.calls.map((c) => c[0] as { points: number })
    expect(calls).toHaveLength(1)
    expect(calls[0].points).toBe(69)
  })

  // Coin-flip: gap < 15 → no bonus
  it("coin-flip match (gap=7 < 15) → no upset bonus regardless of who wins", async () => {
    const coinFlipMatch = {
      ...FINISHED_MATCH,
      home_score: 0,
      away_score: 1,
      home_team_code: "EQA",
      away_team_code: "SEN",
    }
    const { predictionsUpdate } = buildService({
      finishedMatches: [coinFlipMatch],
      predictions: [{ id: "p1", user_id: "u1", home_score: 0, away_score: 1 }],
      // home_pct=40, away_pct=33 → gap=7 < 15 → NOT eligible
      matchPrediction: { home_pct: 40, away_pct: 33 },
    })

    await POST(syncRequest())

    // exact score (pred 0-1 = match 0-1) = 50, no bonus (gap too small)
    const calls = predictionsUpdate.mock.calls.map((c) => c[0] as { points: number })
    expect(calls[0].points).toBe(50)
  })

  // Favorite wins → no bonus (away_pct=25 < home_pct=46 → home is favorite, home wins)
  it("favorite wins (gap>=15 but winner is favorite) → no upset bonus", async () => {
    const favoriteWinsMatch = {
      ...FINISHED_MATCH,
      home_score: 2,
      away_score: 0,
      home_team_code: "BRA",
      away_team_code: "BOL",
    }
    const { predictionsUpdate } = buildService({
      finishedMatches: [favoriteWinsMatch],
      predictions: [{ id: "p1", user_id: "u1", home_score: 2, away_score: 0 }],
      // home=65 is favorite; home wins → NOT an upset
      matchPrediction: { home_pct: 65, away_pct: 18 },
    })

    await POST(syncRequest())

    // exact score = 50, no bonus
    const calls = predictionsUpdate.mock.calls.map((c) => c[0] as { points: number })
    expect(calls[0].points).toBe(50)
  })

  // Draw → no bonus
  it("draw result → no upset bonus even when gap>=15", async () => {
    const drawMatch = {
      ...FINISHED_MATCH,
      home_score: 1,
      away_score: 1,
      home_team_code: "GER",
      away_team_code: "CRC",
    }
    const { predictionsUpdate } = buildService({
      finishedMatches: [drawMatch],
      predictions: [{ id: "p1", user_id: "u1", home_score: 1, away_score: 1 }],
      matchPrediction: { home_pct: 70, away_pct: 12 },
    })

    await POST(syncRequest())

    // exact score (pred 1-1 = match 1-1) = 50, no bonus (draw result never qualifies)
    const calls = predictionsUpdate.mock.calls.map((c) => c[0] as { points: number })
    expect(calls[0].points).toBe(50)
  })

  // No snapshot → no bonus (FINISHED_MATCH: home=2, away=1, home wins)
  it("no match_predictions snapshot → no upset bonus", async () => {
    const { predictionsUpdate } = buildService({
      finishedMatches: [FINISHED_MATCH],
      // user predicts correct result (home win, 1-0) → 24 pts base
      predictions: [{ id: "p1", user_id: "u1", home_score: 1, away_score: 0 }],
      matchPrediction: null, // no snapshot
    })

    await POST(syncRequest())

    // correct result only = 24, no upset bonus (no snapshot)
    const calls = predictionsUpdate.mock.calls.map((c) => c[0] as { points: number })
    expect(calls[0].points).toBe(24)
  })
})
