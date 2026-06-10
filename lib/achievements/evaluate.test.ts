import { describe, expect, it, vi } from "vitest"
import { evalArrancamos } from "@/lib/achievements/evaluate"

function buildSupabase(userRow: { bracket_submitted_at: string | null } | null, error: unknown = null) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: userRow, error }),
  }
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    }),
  } as unknown as ReturnType<typeof import("@/lib/supabase/service").createServiceClient>
}

describe("evalArrancamos", () => {
  it("returns bronze achievement regardless of bracket_submitted_at value", async () => {
    // When awards step is completed, evalArrancamos should fire even without bracket
    const supabase = buildSupabase({ bracket_submitted_at: null })
    const result = await evalArrancamos("user-1", supabase)
    expect(result).toEqual({ achievement_id: "arrancamos", tier: "bronze", progress_json: null })
  })

  it("also fires when bracket_submitted_at is set (existing behavior preserved)", async () => {
    const supabase = buildSupabase({ bracket_submitted_at: "2026-06-01T00:00:00Z" })
    const result = await evalArrancamos("user-1", supabase)
    expect(result).toEqual({ achievement_id: "arrancamos", tier: "bronze", progress_json: null })
  })

  it("returns null when user row is not found", async () => {
    const supabase = buildSupabase(null)
    const result = await evalArrancamos("user-1", supabase)
    expect(result).toBeNull()
  })

  it("returns null on database error", async () => {
    const supabase = buildSupabase(null, { message: "db error" })
    const result = await evalArrancamos("user-1", supabase)
    expect(result).toBeNull()
  })
})
