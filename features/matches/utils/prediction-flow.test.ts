import { describe, expect, it } from "vitest"

import { derivePredictionFlow } from "@/features/matches/utils/prediction-flow"

describe("derivePredictionFlow", () => {
  it("locks score but keeps extras editable when an upcoming match already has a prediction", () => {
    expect(derivePredictionFlow({ matchStatus: "UPCOMING", hasScore: true, editLocked: false })).toEqual({
      scoreLocked: true,
      extrasVisible: true,
      extrasLocked: false,
    })
  })

  it("keeps extras hidden until a score prediction exists", () => {
    expect(derivePredictionFlow({ matchStatus: "UPCOMING", hasScore: false, editLocked: false })).toEqual({
      scoreLocked: false,
      extrasVisible: false,
      extrasLocked: false,
    })
  })

  it("keeps extras visible but locked after they were saved", () => {
    expect(derivePredictionFlow({ matchStatus: "UPCOMING", hasScore: true, editLocked: true })).toEqual({
      scoreLocked: true,
      extrasVisible: true,
      extrasLocked: true,
    })
  })
})
