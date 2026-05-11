import { describe, expect, it, vi } from "vitest"
import { getStandingsByGroup } from "@/features/standings/api/index"

type StandingRow = {
  group_code: string
  team_code: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

function buildSupabase(rows: StandingRow[]) {
  const order = vi
    .fn()
    .mockImplementationOnce(() => ({
      order: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }))

  const select = vi.fn().mockReturnValue({ order })
  const from = vi.fn().mockReturnValue({ select })

  return { from }
}

describe("features/standings/api", () => {
  it("groups standings by group_code and sorts by points desc", async () => {
    const supabase = buildSupabase([
      {
        group_code: "A",
        team_code: "BRA",
        played: 3,
        won: 2,
        drawn: 0,
        lost: 1,
        goals_for: 5,
        goals_against: 3,
        points: 6,
      },
      {
        group_code: "A",
        team_code: "ARG",
        played: 3,
        won: 2,
        drawn: 1,
        lost: 0,
        goals_for: 7,
        goals_against: 2,
        points: 7,
      },
      {
        group_code: "B",
        team_code: "ESP",
        played: 3,
        won: 3,
        drawn: 0,
        lost: 0,
        goals_for: 8,
        goals_against: 1,
        points: 9,
      },
    ])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups.map((group) => group.id)).toEqual(["A", "B"])
    expect(groups[0]?.rows.map((row) => row.team)).toEqual(["ARG", "BRA"])
  })

  it("returns empty array when standings is empty", async () => {
    const supabase = buildSupabase([])

    const groups = await getStandingsByGroup(supabase as never)

    expect(groups).toEqual([])
  })
})
