import { beforeEach, describe, expect, it, vi } from "vitest"

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mocks = vi.hoisted(() => ({
  getLiveMatches: vi.fn(),
  getUpcomingMatches: vi.fn(),
  getUserGroups: vi.fn(),
  getGroupInfo: vi.fn(),
  getGroupLeaderboard: vi.fn(),
  getUserStats: vi.fn(),
}))

vi.mock("@/features/matches/api", () => ({
  getLiveMatches: mocks.getLiveMatches,
  getUpcomingMatches: mocks.getUpcomingMatches,
}))

vi.mock("@/features/groups/api", () => ({
  getUserGroups: mocks.getUserGroups,
  getGroupLeaderboard: mocks.getGroupLeaderboard,
  getGroupInfo: mocks.getGroupInfo,
}))

vi.mock("@/features/profile/api", () => ({
  getUserStats: mocks.getUserStats,
}))

import { getHomeData } from "@/features/home/api/index"

function buildSupabase() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          not: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          in: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  }
}

describe("features/home/api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("starts independent queries in parallel", async () => {
    const liveDeferred = deferred<[]>() 
    const upcomingDeferred = deferred<[]>() 
    const groupsDeferred = deferred<[]>() 
    const statsDeferred = deferred<{ totalPts: number; predictionPts: number; achievementPts: number; predictionCount: number; accuracy: number | null; streak: number }>()

    mocks.getLiveMatches.mockReturnValueOnce(liveDeferred.promise)
    mocks.getUpcomingMatches.mockReturnValueOnce(upcomingDeferred.promise)
    mocks.getUserGroups.mockReturnValueOnce(groupsDeferred.promise)
    mocks.getUserStats.mockReturnValueOnce(statsDeferred.promise)
    mocks.getGroupLeaderboard.mockResolvedValueOnce([])

    const pending = getHomeData(buildSupabase() as never, "user-1")

    expect(mocks.getLiveMatches).toHaveBeenCalledTimes(1)
    expect(mocks.getUpcomingMatches).toHaveBeenCalledTimes(1)
    expect(mocks.getUserGroups).toHaveBeenCalledTimes(1)
    expect(mocks.getUserStats).toHaveBeenCalledTimes(1)

    liveDeferred.resolve([])
    upcomingDeferred.resolve([])
    groupsDeferred.resolve([])
    statsDeferred.resolve({ totalPts: 0, predictionPts: 0, achievementPts: 0, predictionCount: 0, accuracy: null, streak: 0 })

    const result = await pending

    expect(result.top3).toEqual([])
    expect(result.groupInfo).toBeNull()
  })

  it("returns empty leaderboard when user has no group", async () => {
    mocks.getLiveMatches.mockResolvedValueOnce([])
    mocks.getUpcomingMatches.mockResolvedValueOnce([])
    mocks.getUserGroups.mockResolvedValueOnce([])
    mocks.getUserStats.mockResolvedValueOnce({ totalPts: 0, predictionPts: 0, achievementPts: 0, predictionCount: 0, accuracy: null, streak: 0 })

    const result = await getHomeData(buildSupabase() as never, "user-2")

    expect(result.top3).toEqual([])
    expect(result.you).toBeUndefined()
  })

  it("merges user predictions into live matches", async () => {
    mocks.getLiveMatches.mockResolvedValueOnce([
      { id: "live-1", home: "ARG", away: "BRA", status: "LIVE", hs: 1, as: 0, kickoff: "", stage: "Group Stage" },
    ])
    mocks.getUpcomingMatches.mockResolvedValueOnce([])
    mocks.getUserGroups.mockResolvedValueOnce([])
    mocks.getUserStats.mockResolvedValueOnce({ totalPts: 0, predictionPts: 0, achievementPts: 0, predictionCount: 0, accuracy: null, streak: 0 })

    const supabase = {
      from: (table: string) => {
        if (table === "predictions") {
          return {
            select: () => ({
              eq: () => ({
                in: () =>
                  Promise.resolve({
                    data: [{ match_id: "live-1", home_score: 2, away_score: 1 }],
                    error: null,
                  }),
                not: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        return buildSupabase().from(table)
      },
    }

    const result = await getHomeData(supabase as never, "user-3")

    expect(result.liveMatches[0]?.pred).toEqual({ hs: 2, as: 1 })
  })
})
