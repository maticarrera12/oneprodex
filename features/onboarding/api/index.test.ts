import { describe, expect, it } from "vitest"
import { deriveOnboardingStep } from "@/features/onboarding/api"

describe("deriveOnboardingStep", () => {
  it("returns complete when bracket is submitted", () => {
    const step = deriveOnboardingStep({
      submittedAt: "2026-05-14T12:00:00.000Z",
      groupPickCount: 48,
      bestThirdCount: 8,
      bracketPickCount: 32,
      hasTournamentPrediction: true,
      hasAllAwards: true,
    })
    expect(step).toBe("complete")
  })

  it("returns step 1 when group picks are incomplete", () => {
    const step = deriveOnboardingStep({
      submittedAt: null,
      groupPickCount: 47,
      bestThirdCount: 0,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
    })
    expect(step).toBe(1)
  })

  it("returns step 2 when best thirds are incomplete", () => {
    const step = deriveOnboardingStep({
      submittedAt: null,
      groupPickCount: 48,
      bestThirdCount: 7,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
    })
    expect(step).toBe(2)
  })

  it("returns step 3 when bracket picks are incomplete", () => {
    const step = deriveOnboardingStep({
      submittedAt: null,
      groupPickCount: 48,
      bestThirdCount: 8,
      bracketPickCount: 31,
      hasTournamentPrediction: false,
      hasAllAwards: false,
    })
    expect(step).toBe(3)
  })

  it("returns step 4 when awards are missing", () => {
    const step = deriveOnboardingStep({
      submittedAt: null,
      groupPickCount: 48,
      bestThirdCount: 8,
      bracketPickCount: 32,
      hasTournamentPrediction: false,
      hasAllAwards: false,
    })
    expect(step).toBe(4)
  })
})
