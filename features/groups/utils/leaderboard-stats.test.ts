import { describe, expect, it } from "vitest"
import { computeMemberLeaderboardStats } from "@/features/groups/utils/leaderboard-stats"

describe("computeMemberLeaderboardStats", () => {
  it("returns zero stats when nothing is scored yet", () => {
    expect(
      computeMemberLeaderboardStats(
        [{ points: null, created_at: "2026-06-11T19:00:00Z" }],
        [{ points: null }],
      ),
    ).toEqual({ acc: 0, streak: 0 })
  })

  it("computes accuracy from scored predictions and bracket picks", () => {
    expect(
      computeMemberLeaderboardStats(
        [
          { points: 50, created_at: "2026-06-12T19:00:00Z" },
          { points: 0, created_at: "2026-06-11T19:00:00Z" },
        ],
        [{ points: 20 }, { points: null }],
      ),
    ).toEqual({ acc: 67, streak: 1 })
  })

  it("counts streak from most recent scored predictions", () => {
    expect(
      computeMemberLeaderboardStats(
        [
          { points: 24, created_at: "2026-06-13T19:00:00Z" },
          { points: 50, created_at: "2026-06-12T19:00:00Z" },
          { points: 0, created_at: "2026-06-11T19:00:00Z" },
        ],
        [],
      ),
    ).toEqual({ acc: 67, streak: 2 })
  })
})
