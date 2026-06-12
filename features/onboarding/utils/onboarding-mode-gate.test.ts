import { describe, expect, it } from "vitest"
import { shouldReDeriveGroupRankings } from "@/features/onboarding/utils/onboarding-mode-gate"

describe("shouldReDeriveGroupRankings", () => {
  it("returns true for prode-mode user — derive should run", () => {
    expect(shouldReDeriveGroupRankings({ onboarding_mode: "prode" })).toBe(true)
  })

  it("returns false for quick-mode user — derive must NOT run (quick users have hand-picked group_picks)", () => {
    expect(shouldReDeriveGroupRankings({ onboarding_mode: "quick" })).toBe(false)
  })

  it("returns false when onboarding_mode is null (user has not set a mode yet)", () => {
    expect(shouldReDeriveGroupRankings({ onboarding_mode: null })).toBe(false)
  })

  it("returns false for any other string value (defensive guard)", () => {
    expect(shouldReDeriveGroupRankings({ onboarding_mode: "unknown" })).toBe(false)
  })
})
