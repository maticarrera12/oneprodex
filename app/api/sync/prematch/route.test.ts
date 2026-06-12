import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  fetchPredictions: vi.fn(),
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
  storedPredictionIds = [] as string[],
  insertError = null as { message: string } | null,
} = {}) {
  const matchesChain = chainResolving({ data: upcomingMatches, error: null })
  const storedIdsChain = chainResolving({ data: storedPredictionIds.map((id) => ({ match_id: id })), error: null })
  const insertChain = chainResolving({ data: null, error: insertError })

  const matchPredictionsFrom = {
    select: vi.fn(() => storedIdsChain),
    upsert: vi.fn(() => insertChain),
  }

  const service = {
    from: vi.fn((table: string) => {
      if (table === "matches") return { select: vi.fn(() => matchesChain) }
      if (table === "match_predictions") return matchPredictionsFrom
      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  mocks.createServiceClient.mockReturnValue(service)
  return { service, matchPredictionsFrom }
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
    const payload = (await response.json()) as { predictions: number; failed: number }

    expect(payload).toEqual({ predictions: 0, failed: 1 })
  })
})
