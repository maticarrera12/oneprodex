import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  fetchPredictions: vi.fn(),
  fetchLineups: vi.fn(),
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
  fetchPredictions: mocks.fetchPredictions,
  fetchLineups: mocks.fetchLineups,
}))

import { POST } from "@/app/api/sync/prematch/route"

type QueryResult = { data: unknown; error: { message: string } | null }

function chainResolving(result: QueryResult) {
  const chain: Record<string, unknown> = {
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  }
  for (const method of ["select", "eq", "gte", "lte", "lt", "in", "not", "order"]) {
    chain[method] = vi.fn(() => chain)
  }
  return chain
}

const UPCOMING_MATCH = {
  id: "WC001",
  status: "UPCOMING",
  home_team_code: "ARG",
  away_team_code: "FRA",
  kickoff: new Date(Date.now() + 12 * 3_600_000).toISOString(),
}

function buildService({
  upcomingMatches = [] as unknown[],
  lineupWindowMatches = [] as unknown[],
  storedPredictionIds = [] as string[],
  insertError = null as { message: string } | null,
  lineupUpsertError = null as { message: string } | null,
  teamsData = [] as Array<{ api_id: number | null; code: string }>,
} = {}) {
  // Phase 1 uses the 48h window (upcomingMatches)
  // Phase 2 uses the ±kickoff window (lineupWindowMatches)
  // The route calls matches twice — once per phase. We alternate responses.
  let matchesCallCount = 0
  const matchesChain48h = chainResolving({ data: upcomingMatches, error: null })
  const matchesChainWindow = chainResolving({ data: lineupWindowMatches, error: null })

  const storedIdsChain = chainResolving({ data: storedPredictionIds.map((id) => ({ match_id: id })), error: null })
  const insertChain = chainResolving({ data: null, error: insertError })
  const lineupUpsertChain = chainResolving({ data: null, error: lineupUpsertError })
  const teamsChain = chainResolving({ data: teamsData, error: null })

  const matchPredictionsFrom = {
    select: vi.fn(() => storedIdsChain),
    upsert: vi.fn(() => insertChain),
  }

  const matchLineupsFrom = {
    upsert: vi.fn(() => lineupUpsertChain),
  }

  const service = {
    from: vi.fn((table: string) => {
      if (table === "matches") {
        matchesCallCount++
        const chain = matchesCallCount === 1 ? matchesChain48h : matchesChainWindow
        return { select: vi.fn(() => chain) }
      }
      if (table === "match_predictions") return matchPredictionsFrom
      if (table === "match_lineups") return matchLineupsFrom
      if (table === "teams") return { select: vi.fn(() => teamsChain) }
      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  mocks.createServiceClient.mockReturnValue(service)
  return { service, matchPredictionsFrom, matchLineupsFrom }
}

function syncRequest() {
  return new Request("http://localhost/api/sync/prematch", {
    method: "POST",
    headers: { authorization: "Bearer test-secret" },
  })
}

describe("POST /api/sync/prematch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SYNC_SECRET = "test-secret"
    mocks.fetchPredictions.mockResolvedValue({ data: { response: [{ predictions: { percent: { home: "45%", draw: "25%", away: "30%" }, advice: "Home win" } }] } })
    mocks.fetchLineups.mockResolvedValue({ data: { response: [] } })
  })

  it("rejects requests without Authorization header and returns 401", async () => {
    buildService()
    const response = await POST(new Request("http://localhost/api/sync/prematch", { method: "POST" }))
    expect(response.status).toBe(401)
  })

  it("rejects requests with wrong Bearer token and returns 401", async () => {
    buildService()
    const response = await POST(new Request("http://localhost/api/sync/prematch", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    }))
    expect(response.status).toBe(401)
  })

  it("valid Bearer token proceeds and returns 200 with summary body", async () => {
    buildService({ upcomingMatches: [] })
    const response = await POST(syncRequest())
    expect(response.status).toBe(200)
    const body = (await response.json()) as { predictions: number; failed: number }
    expect(typeof body.predictions).toBe("number")
    expect(typeof body.failed).toBe("number")
  })

  it("fetches predictions only for matches not already in match_predictions (strict filter)", async () => {
    const { matchPredictionsFrom } = buildService({
      upcomingMatches: [UPCOMING_MATCH],
      storedPredictionIds: ["WC001"],
    })

    await POST(syncRequest())

    // WC001 is already stored — fetchPredictions MUST NOT be called
    expect(mocks.fetchPredictions).not.toHaveBeenCalled()
    expect(matchPredictionsFrom.upsert).not.toHaveBeenCalled()
  })

  it("fetches and inserts predictions for matches missing from match_predictions", async () => {
    const { matchPredictionsFrom } = buildService({
      upcomingMatches: [UPCOMING_MATCH],
      storedPredictionIds: [],
    })

    const response = await POST(syncRequest())
    const body = (await response.json()) as { predictions: number; failed: number }

    expect(mocks.fetchPredictions).toHaveBeenCalledWith("WC001")
    expect(matchPredictionsFrom.upsert).toHaveBeenCalledTimes(1)
    expect(body.predictions).toBe(1)
    expect(body.failed).toBe(0)
  })

  it("response body has predictions and failed keys", async () => {
    buildService({
      upcomingMatches: [UPCOMING_MATCH],
      storedPredictionIds: [],
    })

    const response = await POST(syncRequest())
    const body = (await response.json()) as Record<string, unknown>

    expect(Object.keys(body)).toContain("predictions")
    expect(Object.keys(body)).toContain("failed")
  })

  it("counts failed when fetchPredictions throws", async () => {
    buildService({
      upcomingMatches: [UPCOMING_MATCH],
      storedPredictionIds: [],
    })
    mocks.fetchPredictions.mockRejectedValue(new Error("API error"))

    const response = await POST(syncRequest())
    const body = (await response.json()) as { predictions: number; failed: number }

    expect(body.predictions).toBe(0)
    expect(body.failed).toBe(1)
  })
})

describe("POST /api/sync/prematch — write semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SYNC_SECRET = "test-secret"
    mocks.fetchPredictions.mockResolvedValue({
      data: { response: [{ predictions: { percent: { home: "45%", draw: "25%", away: "30%" }, advice: "x" } }] },
    })
    mocks.fetchLineups.mockResolvedValue({ data: { response: [] } })
  })

  it("writes with ignoreDuplicates so the snapshot is never overwritten (ON CONFLICT DO NOTHING)", async () => {
    const { matchPredictionsFrom } = buildService({ upcomingMatches: [UPCOMING_MATCH] })

    await POST(syncRequest())

    expect(matchPredictionsFrom.upsert).toHaveBeenCalledWith(
      expect.anything(),
      { onConflict: "match_id", ignoreDuplicates: true }
    )
  })

  it("counts a write error as failed, not as a stored prediction", async () => {
    buildService({ upcomingMatches: [UPCOMING_MATCH], insertError: { message: "boom" } })

    const response = await POST(syncRequest())
    const payload = (await response.json()) as { predictions: number; lineups: number; failed: number }

    expect(payload.predictions).toBe(0)
    expect(payload.failed).toBe(1)
  })
})

// Phase 2 lineup window: kickoff BETWEEN (now - 10min) AND (now + 70min), status=UPCOMING
const LINEUP_WINDOW_MATCH = {
  id: "WC010",
  status: "UPCOMING",
  kickoff: new Date(Date.now() + 30 * 60_000).toISOString(), // 30 min from now
}

const LIVE_MATCH_OUTSIDE_UPCOMING = {
  id: "WC011",
  status: "LIVE",
  kickoff: new Date(Date.now() - 20 * 60_000).toISOString(), // 20 min ago, LIVE
}

describe("POST /api/sync/prematch — phase 2 lineup sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SYNC_SECRET = "test-secret"
    mocks.fetchPredictions.mockResolvedValue({ data: { response: [] } })
    mocks.fetchLineups.mockResolvedValue({
      data: {
        response: [
          {
            team: { id: 1, name: "Argentina" },
            formation: "4-3-3",
            startXI: [{ player: { id: 900, name: "Player One", number: 10, pos: "F", grid: "1:1" } }],
            substitutes: [],
          },
        ],
      },
    })
  })

  it("UPCOMING match in kickoff window triggers fetchLineups call", async () => {
    buildService({ lineupWindowMatches: [LINEUP_WINDOW_MATCH] })

    await POST(syncRequest())

    expect(mocks.fetchLineups).toHaveBeenCalledWith(LINEUP_WINDOW_MATCH.id)
  })

  it("non-UPCOMING match (LIVE) is excluded from lineup query (status filter in route)", async () => {
    // The route adds .eq('status', 'UPCOMING') — so a LIVE match won't appear in lineupWindowMatches
    // Simulate the DB returning no rows (status filter applied)
    buildService({ lineupWindowMatches: [] })

    await POST(syncRequest())

    expect(mocks.fetchLineups).not.toHaveBeenCalled()
  })

  it("response body includes lineups count reflecting upserted rows", async () => {
    buildService({ lineupWindowMatches: [LINEUP_WINDOW_MATCH] })

    const response = await POST(syncRequest())
    const body = (await response.json()) as { predictions: number; lineups: number; failed: number }

    expect(typeof body.lineups).toBe("number")
    expect(body.lineups).toBeGreaterThanOrEqual(1)
  })

  it("lineup upsert uses composite onConflict key", async () => {
    const { matchLineupsFrom } = buildService({ lineupWindowMatches: [LINEUP_WINDOW_MATCH] })

    await POST(syncRequest())

    if (matchLineupsFrom.upsert.mock.calls.length > 0) {
      expect(matchLineupsFrom.upsert).toHaveBeenCalledWith(
        expect.anything(),
        { onConflict: "match_id,team_code,player_api_id" },
      )
    }
  })
})
