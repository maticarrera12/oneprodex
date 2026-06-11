import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
}))

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}))

import { GET } from "@/app/api/players/search/route"

type QueryResult = { data: unknown[] | null; error: { message: string } | null }

function buildQueryChain(result: QueryResult) {
  const chain = {
    select: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  }
  return chain
}

function mockService(result: QueryResult = { data: [], error: null }) {
  const chain = buildQueryChain(result)
  mocks.createServiceClient.mockReturnValue({ from: vi.fn(() => chain) })
  return chain
}

function request(params: string) {
  return new Request(`http://localhost/api/players/search?${params}`)
}

describe("GET /api/players/search", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("searches accent-insensitively against the normalized column", async () => {
    const chain = mockService()

    await GET(request("q=Mbapp%C3%A9"))

    expect(chain.ilike).toHaveBeenCalledWith("name_search", "%mbappe%")
  })

  it("returns matching players", async () => {
    const players = [{ api_id: 7, name: "Kylian Mbappé", photo_url: null, team_code: "FRA" }]
    mockService({ data: players, error: null })

    const response = await GET(request("q=mbappe"))
    const payload = (await response.json()) as { data: unknown[] }

    expect(payload.data).toEqual(players)
  })

  it("short-circuits queries under 2 characters without hitting the database", async () => {
    mockService()

    const response = await GET(request("q=m"))
    const payload = (await response.json()) as { data: unknown[] }

    expect(payload.data).toEqual([])
    expect(mocks.createServiceClient).not.toHaveBeenCalled()
  })

  it("filters by birth date when young=1", async () => {
    const chain = mockService()

    await GET(request("q=yamal&young=1"))

    expect(chain.gte).toHaveBeenCalledWith("date_of_birth", "2005-01-01")
  })
})
