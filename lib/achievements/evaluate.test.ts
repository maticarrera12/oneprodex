import { describe, expect, it, vi } from "vitest"
import { evalArrancamos } from "@/lib/achievements/evaluate"

type TournamentRow = {
  top_scorer_api_id: number | null
  best_player_api_id: number | null
  best_young_player_api_id: number | null
}

function buildSupabase(row: TournamentRow | null, error: unknown = null) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  }
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    }),
  } as unknown as ReturnType<typeof import("@/lib/supabase/service").createServiceClient>
}

const fullAwards: TournamentRow = {
  top_scorer_api_id: 1,
  best_player_api_id: 2,
  best_young_player_api_id: 3,
}

describe("evalArrancamos", () => {
  it("returns bronze when all 3 awards are filled", async () => {
    const result = await evalArrancamos("user-1", buildSupabase(fullAwards))
    expect(result).toEqual({ achievement_id: "arrancamos", tier: "bronze", progress_json: null })
  })

  it("returns null when top_scorer_api_id is missing", async () => {
    const result = await evalArrancamos("user-1", buildSupabase({ ...fullAwards, top_scorer_api_id: null }))
    expect(result).toBeNull()
  })

  it("returns null when best_player_api_id is missing", async () => {
    const result = await evalArrancamos("user-1", buildSupabase({ ...fullAwards, best_player_api_id: null }))
    expect(result).toBeNull()
  })

  it("returns null when best_young_player_api_id is missing", async () => {
    const result = await evalArrancamos("user-1", buildSupabase({ ...fullAwards, best_young_player_api_id: null }))
    expect(result).toBeNull()
  })

  it("returns null when tournament_predictions row not found", async () => {
    const result = await evalArrancamos("user-1", buildSupabase(null))
    expect(result).toBeNull()
  })

  it("returns null on database error", async () => {
    const result = await evalArrancamos("user-1", buildSupabase(null, { message: "db error" }))
    expect(result).toBeNull()
  })
})
