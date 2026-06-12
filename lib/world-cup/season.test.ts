import { describe, expect, it, vi } from "vitest"
import {
  applyWorldCupSeasonKickoffFilter,
  getWorldCupKickoffRange,
  getWorldCupSeason,
} from "@/lib/world-cup/season"

describe("lib/world-cup/season", () => {
  it("defaults to 2026 when FOOTBALL_SEASON is unset", () => {
    vi.stubEnv("FOOTBALL_SEASON", "")
    expect(getWorldCupSeason()).toBe(2026)
    vi.unstubAllEnvs()
  })

  it("reads FOOTBALL_SEASON from env", () => {
    vi.stubEnv("FOOTBALL_SEASON", "2026")
    expect(getWorldCupSeason()).toBe(2026)
    vi.unstubAllEnvs()
  })

  it("builds kickoff bounds for the configured season", () => {
    expect(getWorldCupKickoffRange(2026)).toEqual({
      from: "2026-01-01T00:00:00.000Z",
      to: "2027-01-01T00:00:00.000Z",
    })
  })

  it("applies kickoff bounds to match queries", () => {
    const query = {
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
    }

    applyWorldCupSeasonKickoffFilter(query, 2026)

    expect(query.gte).toHaveBeenCalledWith("kickoff", "2026-01-01T00:00:00.000Z")
    expect(query.lt).toHaveBeenCalledWith("kickoff", "2027-01-01T00:00:00.000Z")
  })
})
