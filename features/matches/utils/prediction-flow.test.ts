import { describe, expect, it } from "vitest"

import { derivePredictionFlow, canPickScorerForTeam } from "@/features/matches/utils/prediction-flow"

describe("derivePredictionFlow", () => {
  it("locks score but keeps extras editable when an upcoming match already has a prediction", () => {
    expect(derivePredictionFlow({ matchStatus: "UPCOMING", hasScore: true, editLocked: false })).toEqual({
      scoreLocked: true,
      extrasVisible: true,
      extrasLocked: false,
      extrasReady: true,
    })
  })

  it("keeps extras visible but not ready until a score prediction exists", () => {
    expect(derivePredictionFlow({ matchStatus: "UPCOMING", hasScore: false, editLocked: false })).toEqual({
      scoreLocked: false,
      extrasVisible: true,
      extrasLocked: false,
      extrasReady: false,
    })
  })

  it("keeps extras visible but locked after they were saved", () => {
    expect(derivePredictionFlow({ matchStatus: "UPCOMING", hasScore: true, editLocked: true })).toEqual({
      scoreLocked: true,
      extrasVisible: true,
      extrasLocked: true,
      extrasReady: true,
    })
  })
})

describe("canPickScorerForTeam", () => {
  it("allows only the team with predicted goals to pick scorers", () => {
    expect(canPickScorerForTeam({ teamSide: "home", homeScore: 1, awayScore: 0 })).toBe(true)
    expect(canPickScorerForTeam({ teamSide: "away", homeScore: 1, awayScore: 0 })).toBe(false)
    expect(canPickScorerForTeam({ teamSide: "home", homeScore: 0, awayScore: 2 })).toBe(false)
    expect(canPickScorerForTeam({ teamSide: "away", homeScore: 0, awayScore: 2 })).toBe(true)
  })

  it("blocks all scorers for 0-0 and allows both sides when both scored", () => {
    expect(canPickScorerForTeam({ teamSide: "home", homeScore: 0, awayScore: 0 })).toBe(false)
    expect(canPickScorerForTeam({ teamSide: "away", homeScore: 0, awayScore: 0 })).toBe(false)
    expect(canPickScorerForTeam({ teamSide: "home", homeScore: 2, awayScore: 1 })).toBe(true)
    expect(canPickScorerForTeam({ teamSide: "away", homeScore: 2, awayScore: 1 })).toBe(true)
  })
})
