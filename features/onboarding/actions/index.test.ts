import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  evaluateUser: vi.fn(),
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

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("@/lib/achievements/evaluate", () => ({
  evaluateUser: mocks.evaluateUser,
}))

import { saveBestThirds, saveBracketPicks, saveGroupPicks, setOnboardingMode, saveMatchScorePick, deriveAndPersistGroupRankings, saveTournamentPredictions, continueFromProdePicks } from "@/features/onboarding/actions"

const ALL_SLOTS = [
  "R32_P1",
  "R32_P2",
  "R32_P3",
  "R32_P4",
  "R32_P5",
  "R32_P6",
  "R32_P7",
  "R32_P8",
  "R32_P9",
  "R32_P10",
  "R32_P11",
  "R32_P12",
  "R32_P13",
  "R32_P14",
  "R32_P15",
  "R32_P16",
  "R16_P1",
  "R16_P2",
  "R16_P3",
  "R16_P4",
  "R16_P5",
  "R16_P6",
  "R16_P7",
  "R16_P8",
  "QF_P1",
  "QF_P2",
  "QF_P3",
  "QF_P4",
  "SF_P1",
  "SF_P2",
  "THIRD",
  "FINAL",
] as const

function buildAuthClient(userId = "user-1") {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }),
    },
  }
}

function buildGroupPicksPayload(): Array<{ group_code: string; position: number; team_code: string }> {
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  return groups.flatMap((group) =>
    [1, 2, 3, 4].map((position) => ({
      group_code: group,
      position,
      team_code: `${group}${position}`,
    }))
  )
}

function buildFormData(key: string, value: unknown): FormData {
  const formData = new FormData()
  formData.set(key, JSON.stringify(value))
  return formData
}

function buildMultiFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value)
  }
  return formData
}

describe("onboarding actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockResolvedValue(buildAuthClient())
    mocks.redirect.mockImplementation(() => {
      throw new Error("redirect")
    })
  })

  describe("saveGroupPicks", () => {
    it("upserts 48 rows when payload is valid", async () => {
      const teamsSelect = vi.fn().mockResolvedValue({ count: 48, error: null })
      const upsert = vi.fn().mockResolvedValue({ error: null })
      const service = {
        from: vi.fn((table: string) => {
          if (table === "teams") return { select: teamsSelect }
          if (table === "group_picks") return { upsert }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)

      await saveGroupPicks(buildFormData("picks", buildGroupPicksPayload()))

      expect(upsert).toHaveBeenCalledTimes(1)
      expect(upsert.mock.calls[0]?.[0]).toHaveLength(48)
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })

    it("rejects when a group is incomplete", async () => {
      const incomplete = buildGroupPicksPayload().slice(0, 47)
      mocks.createServiceClient.mockReturnValue({ from: vi.fn() })

      await expect(saveGroupPicks(buildFormData("picks", incomplete))).rejects.toThrow("Each group must have exactly 4 picks")
    })

    it("rejects duplicate team inside same group", async () => {
      const picks = buildGroupPicksPayload()
      picks[1] = { group_code: "A", position: 2, team_code: "A1" }
      mocks.createServiceClient.mockReturnValue({ from: vi.fn() })

      await expect(saveGroupPicks(buildFormData("picks", picks))).rejects.toThrow("Duplicate team in group A")
    })
  })

  describe("saveBestThirds", () => {
    function makeServiceForBestThirds() {
      const thirdPlaceRows = [
        "A3",
        "B3",
        "C3",
        "D3",
        "E3",
        "F3",
        "G3",
        "H3",
        "I3",
        "J3",
        "K3",
        "L3",
      ].map((team_code) => ({ team_code }))

      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: thirdPlaceRows, error: null }),
      }

      let resetEqCalls = 0
      const resetChain = {
        eq: vi.fn().mockImplementation(() => {
          resetEqCalls += 1
          if (resetEqCalls === 1) return resetChain
          return Promise.resolve({ error: null })
        }),
      }

      const setChain = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      }

      const update = vi.fn((payload: { advances_as_third: boolean }) =>
        payload.advances_as_third ? setChain : resetChain
      )

      const service = {
        from: vi.fn((table: string) => {
          if (table !== "group_picks") throw new Error(`Unexpected table ${table}`)
          return {
            select: vi.fn().mockReturnValue(selectChain),
            update,
          }
        }),
      }

      return { service, update, setChain }
    }

    it("enforces exactly 8 selections", async () => {
      const { service } = makeServiceForBestThirds()
      mocks.createServiceClient.mockReturnValue(service)

      await expect(saveBestThirds(buildFormData("team_codes", ["A3", "B3", "C3", "D3", "E3", "F3", "G3"]))).rejects.toThrow(
        "Select exactly 8 third-place teams"
      )
      await expect(
        saveBestThirds(buildFormData("team_codes", ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3"]))
      ).rejects.toThrow("Select exactly 8 third-place teams")
    })

    it("resets all third-place rows then marks selected ones", async () => {
      const { service, update, setChain } = makeServiceForBestThirds()
      mocks.createServiceClient.mockReturnValue(service)

      const selected = ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"]
      await saveBestThirds(buildFormData("team_codes", selected))

      expect(update).toHaveBeenNthCalledWith(1, { advances_as_third: false })
      expect(update).toHaveBeenNthCalledWith(2, { advances_as_third: true })
      expect(setChain.in).toHaveBeenCalledWith("team_code", selected)
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })
  })

  describe("setOnboardingMode", () => {
    it("writes onboarding_mode for the authenticated user", async () => {
      const updateChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const update = vi.fn().mockReturnValue(updateChain)
      const service = {
        from: vi.fn((table: string) => {
          if (table === "users") return { update }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)

      // redirect() throws internally — catch it so the assertion below can run
      await setOnboardingMode(buildMultiFormData({ mode: "prode" }))

      expect(update).toHaveBeenCalledWith({ onboarding_mode: "prode" })
      expect(updateChain.eq).toHaveBeenCalledWith("id", "user-1")
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })

    it("accepts quick mode", async () => {
      const updateChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      const update = vi.fn().mockReturnValue(updateChain)
      const service = {
        from: vi.fn((table: string) => {
          if (table === "users") return { update }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)

      await setOnboardingMode(buildMultiFormData({ mode: "quick" }))

      expect(update).toHaveBeenCalledWith({ onboarding_mode: "quick" })
    })

    it("throws on invalid mode value", async () => {
      mocks.createServiceClient.mockReturnValue({ from: vi.fn() })

      await expect(
        setOnboardingMode(buildMultiFormData({ mode: "wizard" }))
      ).rejects.toThrow()
    })
  })

  describe("continueFromProdePicks", () => {
    it("marks prode picks as submitted", async () => {
      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const update = vi.fn().mockReturnValue({ eq: updateEq })
      const service = {
        from: vi.fn((table: string) => {
          if (table === "users") return { update }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)

      await continueFromProdePicks()

      expect(update).toHaveBeenCalledWith({ prode_picks_submitted_at: expect.any(String) })
      expect(updateEq).toHaveBeenCalledWith("id", "user-1")
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })
  })

  describe("saveMatchScorePick", () => {
    it("upserts a prediction row and revalidates path", async () => {
      const upsertFn = vi.fn().mockResolvedValue({ error: null })
      const countChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
      }
      // simulate count query after upsert returning < 72
      const selectCountResult = { count: 10, error: null }
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(selectCountResult),
      }
      const service = {
        from: vi.fn((table: string) => {
          if (table === "predictions") {
            return {
              upsert: upsertFn,
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                count: 10,
              }),
            }
          }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
        }),
      }
      // Separate mock to track count
      const countResult = { count: 10, error: null }
      const serviceWithCount = {
        from: vi.fn((table: string) => {
          if (table === "predictions") {
            return {
              upsert: vi.fn().mockResolvedValue({ error: null }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                head: true,
              }),
            }
          }
          return {}
        }),
      }

      // We need to handle: upsert then count query
      const upsert2 = vi.fn().mockResolvedValue({ error: null })
      const countSelectChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      }
      let upsertCalled = false
      const service2 = {
        from: vi.fn((table: string) => {
          if (table === "predictions") {
            return {
              upsert: (payload: unknown, opts: unknown) => {
                upsert2(payload, opts)
                upsertCalled = true
                return Promise.resolve({ error: null })
              },
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                // when count is requested
                then: vi.fn().mockResolvedValue({ count: 10, error: null }),
              }),
            }
          }
          return {}
        }),
      }

      const matchSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "match-1", stage: "Group Stage - Group A" }, error: null }),
      }
      const predSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "matches") return matchSelectChain
          if (table === "predictions") {
            return {
              upsert: upsertFn,
              select: vi.fn(() => predSelectChain),
            }
          }
          return { select: vi.fn().mockReturnThis() }
        }),
      })

      const formData = buildMultiFormData({
        match_id: "match-1",
        home_score: "2",
        away_score: "1",
      })

      // We expect the action to upsert without throwing
      await expect(saveMatchScorePick(formData)).resolves.not.toThrow()
      expect(upsertFn).toHaveBeenCalledWith(
        expect.objectContaining({ match_id: "match-1", home_score: 2, away_score: 1 }),
        { onConflict: "user_id,match_id" }
      )
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })

    it("rejects when match is not a group-stage match (group_code is null)", async () => {
      const matchSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "match-ko", stage: "Round of 16" }, error: null }),
      }
      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "matches") return matchSelectChain
          return { select: vi.fn().mockReturnThis() }
        }),
      })

      const formData = buildMultiFormData({ match_id: "match-ko", home_score: "1", away_score: "0" })
      await expect(saveMatchScorePick(formData)).rejects.toThrow("Not a group-stage match")
    })

    it("rejects when match is not found", async () => {
      const matchSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "matches") return matchSelectChain
          return { select: vi.fn().mockReturnThis() }
        }),
      })

      const formData = buildMultiFormData({ match_id: "no-such-match", home_score: "1", away_score: "0" })
      await expect(saveMatchScorePick(formData)).rejects.toThrow("Not a group-stage match")
    })

    it("calls revalidatePath for /standings in addition to /onboarding", async () => {
      const upsertFn = vi.fn().mockResolvedValue({ error: null })
      const matchSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "m1", stage: "Group Stage - Group A" }, error: null }),
      }
      const predSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "matches") return matchSelectChain
          if (table === "predictions") return { upsert: upsertFn, select: vi.fn().mockReturnValue(predSelectChain) }
          if (table === "group_picks") return { upsert: vi.fn().mockResolvedValue({ error: null }) }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
        }),
      })

      const formData = buildMultiFormData({ match_id: "m1", home_score: "2", away_score: "0" })
      await saveMatchScorePick(formData)

      expect(mocks.revalidatePath).toHaveBeenCalledWith("/standings")
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })
  })

  describe("deriveAndPersistGroupRankings", () => {
    it("returns early without upserting when there are 0 predictions", async () => {
      const upsertFn = vi.fn()
      const predSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "predictions") return { select: vi.fn().mockReturnValue(predSelectChain) }
          if (table === "group_picks") return { upsert: upsertFn }
          return {}
        }),
      })

      await deriveAndPersistGroupRankings("user-1")
      expect(upsertFn).not.toHaveBeenCalled()
    })

    it("upserts 4 group_picks rows for a group with 3 predictions (partial fill)", async () => {
      // Group A has 3 predictions: A1 beats A2, A1 beats A3, A2 draws A3
      const predictions = [
        { match_id: "m1", home_score: 2, away_score: 0, matches: { stage: "Group Stage - 1" } },
        { match_id: "m2", home_score: 1, away_score: 0, matches: { stage: "Group Stage - 1" } },
        { match_id: "m3", home_score: 1, away_score: 1, matches: { stage: "Group Stage - 1" } },
      ]
      const matchRows = [
        { id: "m1", stage: "Group Stage - 1", home_team_code: "A1", away_team_code: "A2" },
        { id: "m2", stage: "Group Stage - 1", home_team_code: "A1", away_team_code: "A3" },
        { id: "m3", stage: "Group Stage - 1", home_team_code: "A2", away_team_code: "A3" },
      ]

      const upsertFn = vi.fn().mockResolvedValue({ error: null })
      const predSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: predictions, error: null }),
      }
      const matchSelectChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: matchRows, error: null }),
      }
      const deleteChain = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      }

      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "predictions") return { select: vi.fn().mockReturnValue(predSelectChain) }
          if (table === "matches") return matchSelectChain
          if (table === "group_picks") return { delete: vi.fn().mockReturnValue(deleteChain), insert: upsertFn }
          return {}
        }),
      })

      await deriveAndPersistGroupRankings("user-1")

      expect(upsertFn).toHaveBeenCalledTimes(1)
      const upsertedRows = upsertFn.mock.calls[0]?.[0] as Array<{ group_code: string; position: number; team_code: string }>
      const groupARows = upsertedRows.filter((r) => r.group_code === "A")
      // Only 3 teams have predictions (A1, A2, A3) — A4 not seen so 3 rows
      expect(groupARows).toHaveLength(3)
      // A1: 6pts — 1st place
      expect(groupARows.find((r) => r.position === 1)?.team_code).toBe("A1")
    })

    it("breaks pts+GD+GF tie alphabetically", async () => {
      // A1 and A2 draw each match they play — identical stats → alphabetical
      const predictions = [
        { match_id: "m1", home_score: 1, away_score: 1, matches: { stage: "Group Stage - 1" } },
      ]
      const matchRows = [
        { id: "m1", stage: "Group Stage - 1", home_team_code: "A1", away_team_code: "A2" },
      ]

      const upsertFn = vi.fn().mockResolvedValue({ error: null })
      const predSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: predictions, error: null }),
      }
      const matchSelectChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: matchRows, error: null }),
      }
      const deleteChain = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      }

      mocks.createServiceClient.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "predictions") return { select: vi.fn().mockReturnValue(predSelectChain) }
          if (table === "matches") return matchSelectChain
          if (table === "group_picks") return { delete: vi.fn().mockReturnValue(deleteChain), insert: upsertFn }
          return {}
        }),
      })

      await deriveAndPersistGroupRankings("user-1")

      const upsertedRows = upsertFn.mock.calls[0]?.[0] as Array<{ group_code: string; position: number; team_code: string }>
      const groupARows = upsertedRows.filter((r) => r.group_code === "A")
      // Alphabetical: A1 first (position 1), A2 second (position 2)
      expect(groupARows.find((r) => r.position === 1)?.team_code).toBe("A1")
      expect(groupARows.find((r) => r.position === 2)?.team_code).toBe("A2")
    })
  })

  describe("saveBracketPicks", () => {
    function validBracketPicks() {
      return ALL_SLOTS.map((slot, index) => ({
        slot,
        team_code: `T${index + 1}`,
      }))
    }

    it("rejects when payload does not contain 32 picks", async () => {
      const picks = validBracketPicks().slice(0, 31)
      mocks.createServiceClient.mockReturnValue({ from: vi.fn() })

      await expect(saveBracketPicks(buildFormData("picks", picks))).rejects.toThrow("Expected 32 bracket picks")
    })

    it("rejects when onboarding is already completed", async () => {
      const bracketUpsert = vi.fn()
      const lockChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { awards_at: "2026-05-14T00:00:00Z" }, error: null }),
      }
      const service = {
        from: vi.fn((table: string) => {
          if (table === "users") return { select: vi.fn().mockReturnValue(lockChain) }
          if (table === "bracket_picks") return { upsert: bracketUpsert }
          if (table === "tournament_predictions") return { upsert: vi.fn() }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)

      await expect(saveBracketPicks(buildFormData("picks", validBracketPicks()))).rejects.toThrow(
        "Forbidden: onboarding already completed"
      )
      expect(bracketUpsert).not.toHaveBeenCalled()
    })

    it("writes champion_code from FINAL slot", async () => {
      const bracketUpsert = vi.fn().mockResolvedValue({ error: null })
      const tournamentUpsert = vi.fn().mockResolvedValue({ error: null })
      const lockChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { awards_at: null }, error: null }),
      }
      const service = {
        from: vi.fn((table: string) => {
          if (table === "users") return { select: vi.fn().mockReturnValue(lockChain) }
          if (table === "bracket_picks") return { upsert: bracketUpsert }
          if (table === "tournament_predictions") return { upsert: tournamentUpsert }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)

      const picks = validBracketPicks().map((pick) => (pick.slot === "FINAL" ? { ...pick, team_code: "ARG" } : pick))
      await saveBracketPicks(buildFormData("picks", picks))

      expect(tournamentUpsert).toHaveBeenCalledWith(
        { user_id: "user-1", champion_code: "ARG" },
        { onConflict: "user_id" }
      )
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
    })
  })

  describe("saveTournamentPredictions", () => {
    it("marks awards_at when all awards are saved", async () => {
      const tournamentSelectChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            top_scorer_api_id: null,
            best_player_api_id: null,
            best_young_player_api_id: null,
          },
          error: null,
        }),
      }
      const tournamentUpsert = vi.fn().mockResolvedValue({ error: null })
      const userUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const userUpdate = vi.fn().mockReturnValue({ eq: userUpdateEq })
      const service = {
        from: vi.fn((table: string) => {
          if (table === "tournament_predictions") {
            return {
              select: vi.fn().mockReturnValue(tournamentSelectChain),
              upsert: tournamentUpsert,
            }
          }
          if (table === "users") return { update: userUpdate }
          throw new Error(`Unexpected table ${table}`)
        }),
      }
      mocks.createServiceClient.mockReturnValue(service)
      mocks.evaluateUser.mockResolvedValue([])

      await saveTournamentPredictions(
        buildMultiFormData({
          top_scorer_api_id: "10",
          best_player_api_id: "20",
          best_young_player_api_id: "30",
        })
      )

      expect(tournamentUpsert).toHaveBeenCalledWith(
        {
          user_id: "user-1",
          top_scorer_api_id: 10,
          best_player_api_id: 20,
          best_young_player_api_id: 30,
        },
        { onConflict: "user_id" }
      )
      expect(userUpdate).toHaveBeenCalledWith({ awards_at: expect.any(String) })
      expect(userUpdateEq).toHaveBeenCalledWith("id", "user-1")
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/onboarding")
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/grupo")
      expect(mocks.redirect).not.toHaveBeenCalled()
    })
  })
})
