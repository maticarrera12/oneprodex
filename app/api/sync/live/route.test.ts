import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  fetchLiveFixtures: vi.fn(),
  fetchFixtureById: vi.fn(),
}))

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock("@/lib/api-football/client", () => ({
  fetchLiveFixtures: mocks.fetchLiveFixtures,
  fetchFixtureById: mocks.fetchFixtureById,
}))

import { GET } from "@/app/api/sync/live/route"

function liveFixture(id: string, status: string, home: number | null, away: number | null, elapsed: number | null = 45) {
  return {
    fixture: { id: Number(id), status: { short: status, elapsed }, date: "2026-06-12T19:00:00+00:00" },
    goals: { home, away },
    league: { round: "Group Stage - 1", group: null },
    teams: { home: { id: 1 }, away: { id: 2 } },
  }
}

function buildService(dbLiveMatchIds: string[]) {
  const updateChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
  const update = vi.fn(() => updateChain)
  const select = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ data: dbLiveMatchIds.map((id) => ({ id })), error: null }),
  }))
  mocks.createServiceClient.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "matches") return { update, select }
      throw new Error(`Unexpected table: ${table}`)
    }),
  })
  return { update, updateChain }
}

function syncRequest() {
  return new Request("http://localhost/api/sync/live", {
    headers: { authorization: "Bearer test-secret" },
  })
}

describe("GET /api/sync/live", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SYNC_SECRET = "test-secret"
    mocks.fetchLiveFixtures.mockResolvedValue({ data: { response: [] } })
  })

  it("rejects requests without the sync secret", async () => {
    buildService([])
    const response = await GET(new Request("http://localhost/api/sync/live"))
    expect(response.status).toBe(401)
  })

  it("reconciles a stuck LIVE match that dropped off the live feed", async () => {
    // Live feed is EMPTY (match just ended) — DB still says LIVE
    const { update, updateChain } = buildService(["1539000"])
    mocks.fetchFixtureById.mockResolvedValue({
      data: { response: [liveFixture("1539000", "FT", 2, 1, 90)] },
    })

    const response = await GET(syncRequest())
    const payload = (await response.json()) as { reconciled: number }

    expect(mocks.fetchFixtureById).toHaveBeenCalledWith("1539000")
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "FINISHED", home_score: 2, away_score: 1 })
    )
    expect(updateChain.eq).toHaveBeenCalledWith("id", "1539000")
    expect(payload.reconciled).toBe(1)
  })

  it("does not reconcile matches still present in the live feed", async () => {
    buildService(["1539000"])
    mocks.fetchLiveFixtures.mockResolvedValue({
      data: { response: [liveFixture("1539000", "1H", 1, 0, 30)] },
    })

    await GET(syncRequest())

    expect(mocks.fetchFixtureById).not.toHaveBeenCalled()
  })

  it("keeps the run alive when a reconcile fetch fails", async () => {
    buildService(["1539000", "1539001"])
    mocks.fetchFixtureById
      .mockRejectedValueOnce(new Error("api hiccup"))
      .mockResolvedValueOnce({ data: { response: [liveFixture("1539001", "AET", 3, 2, 120)] } })

    const response = await GET(syncRequest())
    const payload = (await response.json()) as { reconciled: number }

    expect(response.status).toBe(200)
    expect(payload.reconciled).toBe(1)
  })

  it("updates scores for matches in the live feed as before", async () => {
    const { update } = buildService([])
    mocks.fetchLiveFixtures.mockResolvedValue({
      data: { response: [liveFixture("1539000", "2H", 1, 1, 70)] },
    })

    await GET(syncRequest())

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "LIVE", home_score: 1, away_score: 1, minute: 70 })
    )
    expect(mocks.fetchFixtureById).not.toHaveBeenCalled()
  })
})
