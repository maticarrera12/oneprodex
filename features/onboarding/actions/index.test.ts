import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
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

import { saveBestThirds, saveBracketPicks, saveGroupPicks } from "@/features/onboarding/actions"

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

    it("rejects when bracket is already submitted", async () => {
      const bracketUpsert = vi.fn()
      const lockChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { bracket_submitted_at: "2026-05-14T00:00:00Z" }, error: null }),
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
        "Forbidden: bracket already submitted"
      )
      expect(bracketUpsert).not.toHaveBeenCalled()
    })

    it("writes champion_code from FINAL slot", async () => {
      const bracketUpsert = vi.fn().mockResolvedValue({ error: null })
      const tournamentUpsert = vi.fn().mockResolvedValue({ error: null })
      const lockChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { bracket_submitted_at: null }, error: null }),
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
})
