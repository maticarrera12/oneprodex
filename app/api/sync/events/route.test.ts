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
  predictionsUpdateError = null,
}: {
  finishedMatches?: unknown[]
  predictions?: unknown[]
  matchEvents?: unknown[]
  playerPreds?: unknown[]
  cleanSheets?: unknown[]
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
})
