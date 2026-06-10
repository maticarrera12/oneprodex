import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}))

vi.mock("@/lib/supabase/config", () => ({
  supabaseUrl: "https://supabase.test",
  supabasePublishableKey: "anon-test-key",
}))

import { proxy } from "@/proxy"

function makeRequest(path: string) {
  return new NextRequest(`https://oneprodex.test${path}`)
}

describe("proxy onboarding gate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects authenticated users without completed awards to /onboarding", async () => {
    process.env.NEXT_PUBLIC_ONBOARDING_ENABLED = "true"

    const maybeSingle = vi.fn().mockResolvedValue({ data: { awards_at: null } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })

    mocks.createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue({ select }),
    })

    const response = await proxy(makeRequest("/grupo"))
    expect(response.headers.get("location")).toBe("https://oneprodex.test/onboarding")
  })

  it("does not force onboarding when feature flag is disabled", async () => {
    process.env.NEXT_PUBLIC_ONBOARDING_ENABLED = "false"

    const maybeSingle = vi.fn().mockResolvedValue({ data: { awards_at: null } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })

    mocks.createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue({ select }),
    })

    const response = await proxy(makeRequest("/grupo"))
    expect(response.headers.get("location")).toBeNull()
    expect(response.status).toBe(200)
  })

  it("redirects users with completed awards away from /onboarding to /", async () => {
    process.env.NEXT_PUBLIC_ONBOARDING_ENABLED = "true"

    const maybeSingle = vi.fn().mockResolvedValue({ data: { awards_at: "2026-05-14T00:00:00Z" } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })

    mocks.createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue({ select }),
    })

    const response = await proxy(makeRequest("/onboarding"))
    expect(response.headers.get("location")).toBe("https://oneprodex.test/")
  })

  it("does not treat submitted bracket as completed onboarding without awards", async () => {
    process.env.NEXT_PUBLIC_ONBOARDING_ENABLED = "true"

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { awards_at: null, bracket_submitted_at: "2026-05-14T00:00:00Z" },
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })

    mocks.createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue({ select }),
    })

    const response = await proxy(makeRequest("/grupo"))
    expect(response.headers.get("location")).toBe("https://oneprodex.test/onboarding")
  })
})
