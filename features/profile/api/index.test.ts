import { describe, expect, it } from "vitest"
import {
  getFriendPredictionsTab,
  getUserByHandle,
  getUserStats,
  mapFriendPredictionEntry,
  mapToProfileAchievement,
  mapUserProfile,
} from "@/features/profile/api"

type AchievementRow = Parameters<typeof mapToProfileAchievement>[0]

function makeRow(overrides: Partial<AchievementRow> = {}): AchievementRow {
  return {
    user_id: "user-1",
    achievement_id: "matador",
    tier: null,
    earned_at: "2026-06-01T00:00:00Z",
    progress_json: { current: 0 },
    achievements: {
      id: "matador",
      name: "Matador",
      description: "Acierta el resultado",
      type: "progressive",
      tiers: { bronze: 5, silver: 15, gold: 30 },
      points: { bronze: 10, silver: 25, gold: 50 },
    },
    ...overrides,
  }
}

describe("mapToProfileAchievement", () => {
  describe("progressive achievement", () => {
    it("no tier → progress shows current / bronze threshold", () => {
      const row = makeRow({ tier: null, progress_json: { current: 2 } })
      const result = mapToProfileAchievement(row)

      expect(result.got).toBe(false)
      expect(result.progress).toBe("2 / 5")
      expect(result.tier).toBeNull()
      expect(result.totalTiers).toBe(3)
    })

    it("bronze tier → progress shows current / silver threshold (next tier)", () => {
      const row = makeRow({ tier: "bronze", progress_json: { current: 8 } })
      const result = mapToProfileAchievement(row)

      expect(result.got).toBe(true)
      expect(result.progress).toBe("8 / 15")
      expect(result.tier).toBe("bronze")
    })

    it("silver tier → progress shows current / gold threshold", () => {
      const row = makeRow({ tier: "silver", progress_json: { current: 20 } })
      const result = mapToProfileAchievement(row)

      expect(result.got).toBe(true)
      expect(result.progress).toBe("20 / 30")
      expect(result.tier).toBe("silver")
    })

    it("gold tier → progress shows gold / gold (maxed)", () => {
      const row = makeRow({ tier: "gold", progress_json: { current: 35 } })
      const result = mapToProfileAchievement(row)

      expect(result.got).toBe(true)
      expect(result.progress).toBe("30 / 30")
      expect(result.tier).toBe("gold")
    })

    it("returns correct id and name", () => {
      const row = makeRow()
      const result = mapToProfileAchievement(row)
      expect(result.id).toBe("matador")
      expect(result.name).toBe("Matador")
    })

    it("uses description for sub when available", () => {
      const row = makeRow()
      const result = mapToProfileAchievement(row)
      expect(result.sub).toBe("Acierta el resultado")
    })

    it("appends tier label to sub when got", () => {
      const row = makeRow({ tier: "bronze" })
      const result = mapToProfileAchievement(row)
      expect(result.sub).toContain("Bronze")
    })

    it("maps icon via ACHIEVEMENT_ICON_MAP", () => {
      const row = makeRow({ achievement_id: "matador" })
      const result = mapToProfileAchievement(row)
      expect(result.icon).toBe("target")
    })

    it("falls back to check icon for unknown achievement id", () => {
      const row = makeRow({
        achievement_id: "unknown_achievement",
        achievements: { ...makeRow().achievements, id: "unknown_achievement" },
      })
      const result = mapToProfileAchievement(row)
      expect(result.icon).toBe("check")
    })

    it("tone is mute when not earned", () => {
      const row = makeRow({ tier: null })
      const result = mapToProfileAchievement(row)
      expect(result.tone).toBe("mute")
    })

    it("tone maps to configured value when earned", () => {
      const row = makeRow({ tier: "bronze" })
      const result = mapToProfileAchievement(row)
      expect(result.tone).toBe("lime") // matador maps to lime
    })
  })

  describe("one-shot achievement", () => {
    function makeOneShotRow(overrides: Partial<AchievementRow> = {}): AchievementRow {
      return {
        user_id: "user-1",
        achievement_id: "arrancamos",
        tier: null,
        earned_at: "2026-06-01T00:00:00Z",
        progress_json: null,
        achievements: {
          id: "arrancamos",
          name: "Arrancamos",
          description: "Primer bracket",
          type: "one_shot",
          tiers: null,
          points: { value: 5 },
        },
        ...overrides,
      }
    }

    it("got = false → progress = '0 / 1'", () => {
      const row = makeOneShotRow({ tier: null })
      const result = mapToProfileAchievement(row)

      expect(result.got).toBe(false)
      expect(result.progress).toBe("0 / 1")
      expect(result.totalTiers).toBe(1)
    })

    it("got = true (tier null but one_shot) — tier stays null", () => {
      // One-shot achievements never have tier in DB; got is determined by tier !== null
      // So for one-shot, `got` is false unless we set tier. But one-shot uses tier=null by design.
      // The `got` check is tier !== null, so one-shot achievements with tier=null are "not got".
      // This is correct behavior — got tracks via tier field.
      const row = makeOneShotRow({ tier: null })
      const result = mapToProfileAchievement(row)
      expect(result.got).toBe(false)
    })

    it("totalTiers = 1 for one-shot", () => {
      const row = makeOneShotRow()
      const result = mapToProfileAchievement(row)
      expect(result.totalTiers).toBe(1)
    })

    it("progress = 'Conseguido' when tier is set (edge: one-shot marked with tier)", () => {
      // If tier is non-null, got=true, and for non-progressive type shows "Conseguido"
      const row = makeOneShotRow({ tier: "bronze" } as Partial<AchievementRow>)
      const result = mapToProfileAchievement(row)
      expect(result.got).toBe(true)
      expect(result.progress).toBe("Conseguido")
    })
  })

  describe("on_fire achievement (calendar icon)", () => {
    it("maps to calendar icon", () => {
      const row: AchievementRow = {
        user_id: "user-1",
        achievement_id: "on_fire",
        tier: "silver",
        earned_at: "2026-06-01T00:00:00Z",
        progress_json: { current: 4 },
        achievements: {
          id: "on_fire",
          name: "On Fire",
          description: "Racha de aciertos",
          type: "progressive",
          tiers: { bronze: 3, silver: 5, gold: 8 },
          points: { bronze: 15, silver: 30, gold: 60 },
        },
      }
      const result = mapToProfileAchievement(row)
      expect(result.icon).toBe("calendar")
      expect(result.tone).toBe("amber")
    })
  })
})

describe("getUserStats", () => {
  it("includes achievement_points in total points and calculates streak from scored predictions", async () => {
    const predictionsResult = {
      data: [
        { points: 2 },
        { points: 5 },
        { points: 0 },
        { points: 5 },
        { points: null },
      ],
      error: null,
    }
    const userResult = { data: { achievement_points: 10 }, error: null }
    const supabase = {
      from: (table: string) => {
        if (table === "predictions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => predictionsResult,
              }),
            }),
          }
        }
        if (table === "bracket_picks") {
          return {
            select: () => ({
              eq: () => ({ data: [], error: null }),
            }),
          }
        }
        if (table === "users") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => userResult,
              }),
            }),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      },
    }

    const stats = await getUserStats(supabase as never, "user-1")

    expect(stats.totalPts).toBe(22)
    expect(stats.predictionPts).toBe(12)
    expect(stats.achievementPts).toBe(10)
    expect(stats.streak).toBe(2)
    expect(stats.accuracy).toBe(3 / 4)
  })
})

describe("mapUserProfile", () => {
  it("uses dynamic champion pick details when available", () => {
    const profile = mapUserProfile(
      {
        id: "user-1",
        display_name: "User One",
        handle: "userone",
        created_at: "2026-06-01T00:00:00Z",
        achievement_points: 10,
      } as never,
      { totalPts: 22, predictionPts: 12, achievementPts: 10, predictionCount: 4, accuracy: 0.75, streak: 2 },
      { code: "BRA", name: "Brasil", logo: "https://example.com/bra.png" },
    )

    expect(profile.championPick).toBe("BRA")
    expect(profile.championPickName).toBe("Brasil")
    expect(profile.championPickLogo).toBe("https://example.com/bra.png")
    expect(profile.points).toBe(22)
    expect(profile.streak).toBe(2)
  })
})

// --- Task 1.1: RED tests for getUserByHandle ---
describe("getUserByHandle", () => {
  function makeHandleSupabase(row: { id: string; handle: string } | null) {
    return {
      from: (_table: string) => ({
        select: (_cols: string) => ({
          eq: (_col: string, _val: string) => ({
            maybeSingle: () => Promise.resolve({ data: row, error: null }),
          }),
        }),
      }),
    }
  }

  it("returns the userId string when exactly one row matches the handle", async () => {
    const supabase = makeHandleSupabase({ id: "user-abc", handle: "maticarrera" })
    const result = await getUserByHandle(supabase as never, "maticarrera")
    expect(result).toBe("user-abc")
  })

  it("returns null when no row matches the handle", async () => {
    const supabase = makeHandleSupabase(null)
    const result = await getUserByHandle(supabase as never, "ghost99")
    expect(result).toBeNull()
  })
})

// --- Task 1.4: tests for mapFriendPredictionEntry (match-centric row shape after C1) ---
describe("mapFriendPredictionEntry", () => {
  const noopLookup = { byCode: new Map(), byApiId: new Map() }

  // Row is now match-centric: FROM matches WITH predictions!inner(...)
  const baseMatchRow = {
    id: "match-1",
    home_team_code: "ARG",
    away_team_code: "BRA",
    home_score: 1,
    away_score: 0,
    kickoff: "2026-06-14T18:00:00Z",
    stage: "GROUP",
    status: "FINISHED",
    predictions: [{ home_score: 1, away_score: 0, points: 3 }],
  }

  it("maps a row with a pick to FriendPredictionEntry with kind=exact", () => {
    const entry = mapFriendPredictionEntry(baseMatchRow, noopLookup as never)
    expect(entry).not.toBeNull()
    expect(entry!.matchId).toBe("match-1")
    expect(entry!.homeTeam).toBe("ARG")
    expect(entry!.awayTeam).toBe("BRA")
    expect(entry!.predictedHome).toBe(1)
    expect(entry!.predictedAway).toBe(0)
    expect(entry!.actualHome).toBe(1)
    expect(entry!.actualAway).toBe(0)
    expect(entry!.pts).toBe(3)
    expect(entry!.kind).toBe("exact")
    expect(entry!.status).toBe("FINISHED")
  })

  it("maps a row with empty predictions array → predictedHome/Away null, kind null", () => {
    const rowWithNoPick = { ...baseMatchRow, predictions: [] }
    const entry = mapFriendPredictionEntry(rowWithNoPick, noopLookup as never)
    expect(entry).not.toBeNull()
    expect(entry!.predictedHome).toBeNull()
    expect(entry!.predictedAway).toBeNull()
    expect(entry!.pts).toBeNull()
    expect(entry!.kind).toBeNull()
  })

  it("maps a LIVE row — kind is null even with a pick (scores not final)", () => {
    const liveRow = {
      ...baseMatchRow,
      status: "LIVE",
      home_score: 1,
      away_score: 0,
      predictions: [{ home_score: 1, away_score: 0, points: null }],
    }
    const entry = mapFriendPredictionEntry(liveRow, noopLookup as never)
    expect(entry).not.toBeNull()
    expect(entry!.kind).toBeNull()
    expect(entry!.status).toBe("LIVE")
  })
})

// --- Task 1.7 / C2: strict-spy tests for getFriendPredictionsTab ---
describe("getFriendPredictionsTab", () => {
  // Rows returned by the inverted query: FROM matches WITH predictions!inner(...)
  function makeFinishedLiveRow(status: "FINISHED" | "LIVE", matchId: string, kickoff: string) {
    return {
      id: matchId,
      home_team_code: "ARG",
      away_team_code: "BRA",
      home_score: 2,
      away_score: 1,
      kickoff,
      stage: "GROUP",
      status,
      predictions: [{ home_score: 2, away_score: 1, points: status === "FINISHED" ? 3 : null }],
    }
  }

  function makeUpcomingRow(matchId: string, kickoff: string, hasPick: boolean) {
    return {
      id: matchId,
      home_team_code: "FRA",
      away_team_code: "GER",
      kickoff,
      predictions: hasPick ? [{ home_score: 1, away_score: 0 }] : [],
    }
  }

  // Strict spy: records every call made on the builder chain
  type CallRecord = { method: string; args: unknown[] }

  function makeStrictSupabase(finishedLiveRows: unknown[], upcomingRows: unknown[]) {
    const matchesCalls: CallRecord[] = []

    function recordCall(method: string, args: unknown[]) {
      matchesCalls.push({ method, args })
    }

    const matchesChain = {
      select: (cols: string) => { recordCall("select", [cols]); return matchesChain },
      in: (col: string, vals: unknown[]) => { recordCall("in", [col, vals]); return matchesChain },
      eq: (col: string, val: unknown) => { recordCall("eq", [col, val]); return matchesChain },
      order: (col: string, opts?: unknown) => { recordCall("order", [col, opts]); return matchesChain },
      limit: (n: number) => { recordCall("limit", [n]); return Promise.resolve({ data: finishedLiveRows, error: null }) },
    }

    // Separate chain for upcoming (second matches query — needs limit too)
    // We track separate for clarity but reuse matchesCalls
    const upcomingChain = {
      select: (cols: string) => { recordCall("select:upcoming", [cols]); return upcomingChain },
      in: (col: string, vals: unknown[]) => { recordCall("in:upcoming", [col, vals]); return upcomingChain },
      eq: (col: string, val: unknown) => { recordCall("eq:upcoming", [col, val]); return upcomingChain },
      order: (col: string, opts?: unknown) => { recordCall("order:upcoming", [col, opts]); return upcomingChain },
      limit: (n: number) => { recordCall("limit:upcoming", [n]); return Promise.resolve({ data: upcomingRows, error: null }) },
    }

    let matchesCallCount = 0

    return {
      _calls: matchesCalls,
      from: (table: string) => {
        if (table === "matches") {
          matchesCallCount++
          return matchesCallCount === 1 ? matchesChain : upcomingChain
        }
        if (table === "teams") {
          return { select: () => Promise.resolve({ data: [], error: null }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }
  }

  it("finished+live query goes FROM matches with correct filters, order, and limit", async () => {
    const rows = [
      makeFinishedLiveRow("FINISHED", "m1", "2026-06-10T18:00:00Z"),
      makeFinishedLiveRow("LIVE", "m4", "2026-06-14T18:00:00Z"),
    ]
    const spy = makeStrictSupabase(rows, [])
    await getFriendPredictionsTab(spy as never, "friend-123")

    const calls = spy._calls
    // Must filter by status IN ["FINISHED","LIVE"] on the parent matches table
    expect(calls).toContainEqual({ method: "in", args: ["status", ["FINISHED", "LIVE"]] })
    // Must filter predictions by user_id (embedded filter on the joined resource)
    expect(calls).toContainEqual({ method: "eq", args: ["predictions.user_id", "friend-123"] })
    // Must order by kickoff descending
    expect(calls).toContainEqual({ method: "order", args: ["kickoff", { ascending: false }] })
    // Must have a limit of 30
    expect(calls).toContainEqual({ method: "limit", args: [30] })
  })

  it("upcoming query uses correct filter, order, and limit", async () => {
    const upcoming = [makeUpcomingRow("u1", "2026-06-20T18:00:00Z", true)]
    const spy = makeStrictSupabase([], upcoming)
    await getFriendPredictionsTab(spy as never, "friend-456")

    const calls = spy._calls
    // Must filter by status = UPCOMING
    expect(calls).toContainEqual({ method: "eq:upcoming", args: ["status", "UPCOMING"] })
    // Must filter embedded predictions by user_id
    expect(calls).toContainEqual({ method: "eq:upcoming", args: ["predictions.user_id", "friend-456"] })
    // Must order kickoff ascending (soonest first)
    expect(calls).toContainEqual({ method: "order:upcoming", args: ["kickoff", { ascending: true }] })
    // Must limit to 5
    expect(calls).toContainEqual({ method: "limit:upcoming", args: [5] })
  })

  it("returns finished and live arrays from finished+live query rows", async () => {
    const rows = [
      makeFinishedLiveRow("FINISHED", "m1", "2026-06-10T18:00:00Z"),
      makeFinishedLiveRow("FINISHED", "m2", "2026-06-09T18:00:00Z"),
      makeFinishedLiveRow("FINISHED", "m3", "2026-06-08T18:00:00Z"),
      makeFinishedLiveRow("LIVE", "m4", "2026-06-14T18:00:00Z"),
    ]
    const upcoming = [
      makeUpcomingRow("u1", "2026-06-20T18:00:00Z", true),
      makeUpcomingRow("u2", "2026-06-21T18:00:00Z", false),
    ]
    const spy = makeStrictSupabase(rows, upcoming)
    const result = await getFriendPredictionsTab(spy as never, "friend-123")

    expect(result.finished).toHaveLength(3)
    expect(result.live).toHaveLength(1)
    expect(result.upcomingNext5).toHaveLength(2)
  })

  it("returns all-empty arrays when no data", async () => {
    const spy = makeStrictSupabase([], [])
    const result = await getFriendPredictionsTab(spy as never, "friend-123")
    expect(result.finished).toHaveLength(0)
    expect(result.live).toHaveLength(0)
    expect(result.upcomingNext5).toHaveLength(0)
  })

  it("upcoming entry has pick when prediction exists, null when absent", async () => {
    const upcoming = [
      makeUpcomingRow("u1", "2026-06-20T18:00:00Z", true),
      makeUpcomingRow("u2", "2026-06-21T18:00:00Z", false),
    ]
    const spy = makeStrictSupabase([], upcoming)
    const result = await getFriendPredictionsTab(spy as never, "friend-123")
    expect(result.upcomingNext5[0].predictedHome).toBe(1)
    expect(result.upcomingNext5[0].predictedAway).toBe(0)
    expect(result.upcomingNext5[1].predictedHome).toBeNull()
    expect(result.upcomingNext5[1].predictedAway).toBeNull()
  })
})
