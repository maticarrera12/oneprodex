import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}))

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

import { commitScorerEdits, toggleScorerPrediction } from "@/features/predictions/actions"

function buildAuthClient(userId = "user-1") {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }),
    },
  }
}

function buildFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value)
  }
  return formData
}

describe("commitScorerEdits", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockResolvedValue(buildAuthClient())
  })

  it("locks the prediction and upserts scorer rows on first edit", async () => {
    // CAS chain: update().eq().eq().eq().select() — must support chaining
    const casUpdateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: "pred-1" }], error: null }),
    }
    const deleteChain = {
      eq: vi.fn().mockReturnThis(),
    }
    const insertFn = vi.fn().mockResolvedValue({ error: null })

    const predictionResult = {
      data: { home_score: 1, away_score: 0, edit_locked: false },
      error: null,
    }
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(predictionResult),
    }
    const matchSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { home_team_code: "ARG", away_team_code: "BRA" },
        error: null,
      }),
    }
    const playersSelectChain = {
      in: vi.fn().mockResolvedValue({
        data: [{ api_id: 123, team_code: "ARG" }],
        error: null,
      }),
    }

    const service = {
      from: vi.fn((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue(selectChain),
            update: vi.fn().mockReturnValue(casUpdateChain),
          }
        }
        if (table === "matches") {
          return { select: vi.fn().mockReturnValue(matchSelectChain) }
        }
        if (table === "players") {
          return { select: vi.fn().mockReturnValue(playersSelectChain) }
        }
        if (table === "prediction_players") {
          return {
            delete: vi.fn().mockReturnValue(deleteChain),
            insert: insertFn,
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const scorers = JSON.stringify([{ player_api_id: 123, type: "SCORER" }])
    const cards: string[] = []
    const formData = buildFormData({
      match_id: "match-1",
      scorers,
      cards: JSON.stringify(cards),
    })

    const result = await commitScorerEdits(formData)
    expect(result).not.toHaveProperty("error")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/partidos/match-1")
  })

  it("creates the score, saves extras, and locks details when no prediction exists yet", async () => {
    const predictionSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const upsertFn = vi.fn().mockResolvedValue({ error: null })
    const casUpdateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: "pred-1" }], error: null }),
    }
    const deleteChain = {
      eq: vi.fn().mockReturnThis(),
    }
    const insertFn = vi.fn().mockResolvedValue({ error: null })
    const matchSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { home_team_code: "ARG", away_team_code: "BRA" },
        error: null,
      }),
    }
    const playersSelectChain = {
      in: vi.fn().mockResolvedValue({
        data: [{ api_id: 123, team_code: "ARG" }],
        error: null,
      }),
    }

    const service = {
      from: vi.fn((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue(predictionSelectChain),
            upsert: upsertFn,
            update: vi.fn().mockReturnValue(casUpdateChain),
          }
        }
        if (table === "matches") {
          return { select: vi.fn().mockReturnValue(matchSelectChain) }
        }
        if (table === "players") {
          return { select: vi.fn().mockReturnValue(playersSelectChain) }
        }
        if (table === "prediction_players") {
          return {
            delete: vi.fn().mockReturnValue(deleteChain),
            insert: insertFn,
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const formData = buildFormData({
      match_id: "match-1",
      home_score: "2",
      away_score: "1",
      scorers: JSON.stringify([{ player_api_id: 123, type: "SCORER" }]),
      cards: JSON.stringify([{ player_api_id: 456, type: "YELLOW_CARD" }]),
    })

    const result = await commitScorerEdits(formData)

    expect(result).not.toHaveProperty("error")
    expect(upsertFn).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        match_id: "match-1",
        home_score: 2,
        away_score: 1,
      },
      { onConflict: "user_id,match_id" },
    )
    expect(insertFn).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        match_id: "match-1",
        player_api_id: 123,
        type: "SCORER",
      },
      {
        user_id: "user-1",
        match_id: "match-1",
        player_api_id: 456,
        type: "YELLOW_CARD",
      },
    ])
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/partidos/match-1")
  })

  it("filters scorer picks from teams with zero predicted goals", async () => {
    const predictionSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const matchSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { home_team_code: "ARG", away_team_code: "BRA" },
        error: null,
      }),
    }
    const playersSelectChain = {
      in: vi.fn().mockResolvedValue({
        data: [
          { api_id: 123, team_code: "ARG" },
          { api_id: 456, team_code: "BRA" },
        ],
        error: null,
      }),
    }
    const upsertFn = vi.fn().mockResolvedValue({ error: null })
    const casUpdateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: "pred-1" }], error: null }),
    }
    const deleteChain = {
      eq: vi.fn().mockReturnThis(),
    }
    const insertFn = vi.fn().mockResolvedValue({ error: null })

    const service = {
      from: vi.fn((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue(predictionSelectChain),
            upsert: upsertFn,
            update: vi.fn().mockReturnValue(casUpdateChain),
          }
        }
        if (table === "matches") {
          return { select: vi.fn().mockReturnValue(matchSelectChain) }
        }
        if (table === "players") {
          return { select: vi.fn().mockReturnValue(playersSelectChain) }
        }
        if (table === "prediction_players") {
          return {
            delete: vi.fn().mockReturnValue(deleteChain),
            insert: insertFn,
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const formData = buildFormData({
      match_id: "match-1",
      home_score: "1",
      away_score: "0",
      scorers: JSON.stringify([
        { player_api_id: 123, type: "SCORER" },
        { player_api_id: 456, type: "SCORER" },
      ]),
      cards: JSON.stringify([]),
    })

    const result = await commitScorerEdits(formData)

    expect(result).not.toHaveProperty("error")
    expect(insertFn).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        match_id: "match-1",
        player_api_id: 123,
        type: "SCORER",
      },
    ])
  })

  it("returns already_locked when CAS returns 0 rows (prediction already locked)", async () => {
    // When edit_locked = true, the CAS UPDATE WHERE edit_locked=false returns empty
    const casUpdateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const predictionResult = {
      data: { home_score: 1, away_score: 0, edit_locked: true },
      error: null,
    }
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(predictionResult),
    }

    const service = {
      from: vi.fn((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue(selectChain),
            update: vi.fn().mockReturnValue(casUpdateChain),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const formData = buildFormData({
      match_id: "match-1",
      scorers: JSON.stringify([{ player_api_id: 123, type: "SCORER" }]),
      cards: JSON.stringify([]),
    })

    const result = await commitScorerEdits(formData)
    expect(result).toEqual({ error: "already_locked" })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects scorers but still saves cards when stored score is 0-0", async () => {
    const casUpdateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: "pred-1" }], error: null }),
    }
    const deleteChain = {
      eq: vi.fn().mockReturnThis(),
    }
    const insertFn = vi.fn().mockResolvedValue({ error: null })
    const predictionResult = {
      data: { home_score: 0, away_score: 0, edit_locked: false },
      error: null,
    }
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(predictionResult),
    }

    const service = {
      from: vi.fn((table: string) => {
        if (table === "predictions") {
          return {
            select: vi.fn().mockReturnValue(selectChain),
            update: vi.fn().mockReturnValue(casUpdateChain),
          }
        }
        if (table === "prediction_players") {
          return {
            delete: vi.fn().mockReturnValue(deleteChain),
            insert: insertFn,
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const formData = buildFormData({
      match_id: "match-1",
      scorers: JSON.stringify([{ player_api_id: 123, type: "SCORER" }]),
      cards: JSON.stringify([{ player_api_id: 456, type: "YELLOW_CARD" }]),
    })

    const result = await commitScorerEdits(formData)
    expect(result).not.toHaveProperty("error")
    expect(insertFn).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        match_id: "match-1",
        player_api_id: 456,
        type: "YELLOW_CARD",
      },
    ])
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/partidos/match-1")
  })
})

describe("toggleScorerPrediction — 0-0 guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockResolvedValue(buildAuthClient())
  })

  it("returns early without insert when stored score is 0-0", async () => {
    const matchSelectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { status: "UPCOMING", kickoff: new Date(Date.now() + 60_000).toISOString() },
        error: null,
      }),
    }

    const predictionSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { home_score: 0, away_score: 0 },
        error: null,
      }),
    }

    const insertFn = vi.fn()

    const service = {
      from: vi.fn((table: string) => {
        if (table === "matches") return matchSelectChain
        if (table === "predictions") return { select: vi.fn().mockReturnValue(predictionSelectChain) }
        if (table === "prediction_players") return { select: vi.fn().mockReturnThis(), insert: insertFn }
        throw new Error(`Unexpected table ${table}`)
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const formData = buildFormData({
      match_id: "match-1",
      player_api_id: "123",
    })

    await toggleScorerPrediction(formData)
    expect(insertFn).not.toHaveBeenCalled()
  })
})

describe("savePrediction — score lock guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockResolvedValue(buildAuthClient())
  })

  it("does not upsert score if prediction already exists", async () => {
    const matchSelectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { status: "UPCOMING", kickoff: new Date(Date.now() + 60_000).toISOString() },
        error: null,
      }),
    }

    const existingPrediction = { data: { id: "pred-1" }, error: null }
    const predictionSelectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(existingPrediction),
    }

    const upsertFn = vi.fn()

    const service = {
      from: vi.fn((table: string) => {
        if (table === "matches") return matchSelectChain
        if (table === "predictions") return { select: vi.fn().mockReturnValue(predictionSelectChain), upsert: upsertFn }
        // Other tables not reached because we return early
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), insert: vi.fn() }
      }),
    }
    mocks.createServiceClient.mockReturnValue(service)

    const { savePrediction } = await import("@/features/predictions/actions")
    const formData = buildFormData({
      match_id: "match-1",
      home_score: "2",
      away_score: "1",
    })

    await savePrediction(formData)
    expect(upsertFn).not.toHaveBeenCalled()
  })
})
