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
  getActiveGroupId: vi.fn(),
  getGroupLeaderboard: vi.fn(),
  getUserStats: vi.fn(),
}))

vi.mock("@/features/matches/api", () => ({
  getLiveMatches: mocks.getLiveMatches,
  getUpcomingMatches: mocks.getUpcomingMatches,
}))

vi.mock("@/features/groups/api", () => ({
  getActiveGroupId: mocks.getActiveGroupId,
  getGroupLeaderboard: mocks.getGroupLeaderboard,
  getGroupInfo: vi.fn(),
}))

vi.mock("@/features/profile/api", () => ({
  getUserStats: mocks.getUserStats,
}))

import { getHomeData } from "@/features/home/api/index"

describe("features/home/api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("starts independent queries in parallel", async () => {
    const liveDeferred = deferred<[]>() 
    const upcomingDeferred = deferred<[]>() 
    const groupDeferred = deferred<string | null>() 
    const statsDeferred = deferred<{ totalPts: number; predictionCount: number; accuracy: number | null }>()

    mocks.getLiveMatches.mockReturnValueOnce(liveDeferred.promise)
    mocks.getUpcomingMatches.mockReturnValueOnce(upcomingDeferred.promise)
    mocks.getActiveGroupId.mockReturnValueOnce(groupDeferred.promise)
    mocks.getUserStats.mockReturnValueOnce(statsDeferred.promise)
    mocks.getGroupLeaderboard.mockResolvedValueOnce([])

    const pending = getHomeData({} as never, "user-1")

    expect(mocks.getLiveMatches).toHaveBeenCalledTimes(1)
    expect(mocks.getUpcomingMatches).toHaveBeenCalledTimes(1)
    expect(mocks.getActiveGroupId).toHaveBeenCalledTimes(1)
    expect(mocks.getUserStats).toHaveBeenCalledTimes(1)

    liveDeferred.resolve([])
    upcomingDeferred.resolve([])
    groupDeferred.resolve(null)
    statsDeferred.resolve({ totalPts: 0, predictionCount: 0, accuracy: null })

    const result = await pending

    expect(result.top3).toEqual([])
    expect(result.groupInfo).toBeNull()
  })

  it("returns empty leaderboard when user has no group", async () => {
    mocks.getLiveMatches.mockResolvedValueOnce([])
    mocks.getUpcomingMatches.mockResolvedValueOnce([])
    mocks.getActiveGroupId.mockResolvedValueOnce(null)
    mocks.getUserStats.mockResolvedValueOnce({ totalPts: 0, predictionCount: 0, accuracy: null })

    const result = await getHomeData({} as never, "user-2")

    expect(result.top3).toEqual([])
    expect(result.you).toBeUndefined()
  })
})
