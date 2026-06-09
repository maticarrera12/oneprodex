import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}))

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}))

import { POST } from "@/app/api/achievements/share-bracket/route"

function buildAuthClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
  }
}

function buildServiceClient({
  upsertError = null,
  existingRow = null as { earned_at: string; progress_json?: { credited?: boolean } | null } | null,
  achievementPoints = { value: 10 },
  userPoints = 0,
}: {
  upsertError?: { message: string } | null
  existingRow?: { earned_at: string; progress_json?: { credited?: boolean } | null } | null
  achievementPoints?: { value?: number }
  userPoints?: number
} = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError })
  const maybeSingle = vi.fn()
  const update = vi.fn().mockResolvedValue({ error: null })
  const userUpdate = vi.fn().mockResolvedValue({ error: null })

  let selectCallCount = 0

  const service = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "user_achievements") {
        return {
          upsert,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existingRow }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      if (table === "achievements") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { points: achievementPoints },
              }),
            }),
          }),
        }
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { achievement_points: userPoints },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
    _upsert: upsert,
  }

  return service
}

describe("POST /api/achievements/share-bracket", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when no session", async () => {
    mocks.createClient.mockResolvedValue(buildAuthClient(null))

    const response = await POST()
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("returns 200 on first call with valid session", async () => {
    mocks.createClient.mockResolvedValue(buildAuthClient("user-abc"))

    const service = buildServiceClient({
      existingRow: { earned_at: "2026-06-01T00:00:00Z", progress_json: null },
      userPoints: 0,
    })
    mocks.createServiceClient.mockReturnValue(service)

    const response = await POST()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.ok).toBe(true)
  })

  it("returns 200 on second call (idempotent — no error on duplicate)", async () => {
    mocks.createClient.mockResolvedValue(buildAuthClient("user-abc"))

    // Simulate row already exists with credited flag
    const service = buildServiceClient({
      existingRow: {
        earned_at: "2026-06-01T00:00:00Z",
        progress_json: { credited: true },
      },
      userPoints: 10,
    })
    mocks.createServiceClient.mockReturnValue(service)

    const response = await POST()
    expect(response.status).toBe(200)
  })

  it("returns 500 when upsert fails", async () => {
    mocks.createClient.mockResolvedValue(buildAuthClient("user-abc"))

    const service = buildServiceClient({
      upsertError: { message: "DB error" },
    })
    mocks.createServiceClient.mockReturnValue(service)

    const response = await POST()
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it("does not credit points twice when already credited", async () => {
    mocks.createClient.mockResolvedValue(buildAuthClient("user-abc"))

    const usersUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const service = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "user_achievements") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { earned_at: "2026-06-01T00:00:00Z", progress_json: { credited: true } },
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
          }
        }
        if (table === "achievements") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { points: { value: 10 } } }),
              }),
            }),
          }
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { achievement_points: 10 } }),
              }),
            }),
            update: usersUpdate,
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    await POST()

    // users.update should NOT be called when already credited
    expect(usersUpdate).not.toHaveBeenCalled()
  })
})
