import { describe, expect, it } from "vitest"
import { deriveOnboardingStep } from "@/features/onboarding/api"

describe("deriveOnboardingStep", () => {
  // --- existing quick-mode tests (backward compat) ---

  it("returns complete when awards timestamp exists", () => {
    const step = deriveOnboardingStep({
      awardsAt: "2026-05-14T12:00:00.000Z",
      onboardingMode: "quick",
      groupPickCount: 48,
      bestThirdCount: 8,
      bracketPickCount: 32,
      hasTournamentPrediction: true,
      hasAllAwards: true,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "complete" })
  })

  it("returns mode_select when onboardingMode is null", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: null,
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "mode_select" })
  })

  // --- quick mode ---

  it("returns quick_step 1 when group picks are incomplete (quick mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "quick",
      groupPickCount: 47,
      bestThirdCount: 0,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "quick_step", step: 1 })
  })

  it("returns quick_step 2 when best thirds are incomplete (quick mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "quick",
      groupPickCount: 48,
      bestThirdCount: 7,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "quick_step", step: 2 })
  })

  it("returns quick_step 3 when bracket picks are incomplete (quick mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "quick",
      groupPickCount: 48,
      bestThirdCount: 8,
      bracketPickCount: 31,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "quick_step", step: 3 })
  })

  it("returns quick_step 4 when awards are missing (quick mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "quick",
      groupPickCount: 48,
      bestThirdCount: 8,
      bracketPickCount: 32,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "quick_step", step: 4 })
  })

  // --- prode mode ---

  it("returns prode_picks when prode picks are incomplete (prode mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 20,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "prode_picks", filled: 20, total: 72 })
  })

  it("returns prode_picks with filled=0 when no prode picks exist", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 0,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "prode_picks", filled: 0, total: 72 })
  })

  it("returns bracket when all prode picks done but bracket incomplete (prode mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      prodePicksSubmittedAt: null,
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 10,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 72,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "bracket" })
  })

  it("returns awards when prode picks were saved to continue but are incomplete", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      prodePicksSubmittedAt: "2026-06-10T16:00:00.000Z",
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 0,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 12,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "awards" })
  })

  it("returns awards when prode picks done and bracket done but awards missing (prode mode)", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 32,
      hasTournamentPrediction: false,
      hasAllAwards: false,
      prodePickCount: 72,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "awards" })
  })

  it("returns complete for prode mode when awards timestamp exists", () => {
    const step = deriveOnboardingStep({
      awardsAt: "2026-05-14T12:00:00.000Z",
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 32,
      hasTournamentPrediction: true,
      hasAllAwards: true,
      prodePickCount: 72,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "complete" })
  })

  it("does not complete prode mode from awards alone until awards timestamp is set", () => {
    const step = deriveOnboardingStep({
      awardsAt: null,
      onboardingMode: "prode",
      groupPickCount: 0,
      bestThirdCount: 0,
      bracketPickCount: 32,
      hasTournamentPrediction: true,
      hasAllAwards: true,
      prodePickCount: 72,
      groupStageMatchCount: 72,
    })
    expect(step).toEqual({ status: "awards" })
  })
})
