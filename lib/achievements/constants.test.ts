import { describe, expect, it } from "vitest"
import { isAchievementEnabled } from "@/lib/achievements/constants"

describe("isAchievementEnabled", () => {
  it("juega_david is enabled (not in DISABLED_ACHIEVEMENT_IDS)", () => {
    expect(isAchievementEnabled("juega_david")).toBe(true)
  })

  it("returns true for an unknown achievement id (not disabled)", () => {
    expect(isAchievementEnabled("some_other_achievement")).toBe(true)
  })
})
