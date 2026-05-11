import { describe, expect, it, vi } from "vitest"
import { getLiveMatches, getMatches, getMatchesWithPredictions } from "@/features/matches/api/index"

type ChainResult<T> = {
  data: T
  error: null
}

type MatchRow = {
  id: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  status: string
  minute: number | null
  kickoff: string
  stage: string
}

type PredictionRow = {
  match_id: string
  home_score: number
  away_score: number
}

function buildChain<T>(rows: T) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows, error: null } satisfies ChainResult<T>),
    limit: vi.fn().mockResolvedValue({ data: rows, error: null } satisfies ChainResult<T>),
  }
  return chain
}

function buildSupabaseMock(options: {
  matches: MatchRow[]
  liveMatches?: MatchRow[]
  predictions?: PredictionRow[]
}) {
  const matchesChain = buildChain(options.matches)
  const liveChain = buildChain(options.liveMatches ?? options.matches)
  const predictionsResult = { data: options.predictions ?? [], error: null } satisfies ChainResult<PredictionRow[]>
  const predictionsChain = {
    eq: vi.fn().mockResolvedValue(predictionsResult),
  }
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "predictions") {
      return {
        select: vi.fn().mockReturnValue(predictionsChain),
      }
    }

    return {
      select: vi.fn().mockReturnValue(liveChain),
    }
  })

  return {
    from: fromMock,
    __chains: { matchesChain: liveChain, liveChain, predictionsChain, fromMock },
  }
}

describe("features/matches/api", () => {
  it("returns all matches ordered by kickoff asc", async () => {
    const supabase = buildSupabaseMock({
      matches: [
        {
          id: "m1",
          home_team_code: "ARG",
          away_team_code: "BRA",
          home_score: null,
          away_score: null,
          status: "UPCOMING",
          minute: null,
          kickoff: "2026-07-01T10:00:00Z",
          stage: "Group A",
        },
      ],
    })

    const result = await getMatches(supabase as never)

    expect(result).toHaveLength(1)
    expect(supabase.__chains.matchesChain.order).toHaveBeenCalledWith("kickoff", { ascending: true })
    expect(result[0]?.home).toBe("ARG")
    expect(result[0]?.away).toBe("BRA")
  })

  it("filters live matches by status", async () => {
    const supabase = buildSupabaseMock({
      matches: [],
      liveMatches: [
        {
          id: "m-live",
          home_team_code: "ESP",
          away_team_code: "FRA",
          home_score: 2,
          away_score: 1,
          status: "LIVE",
          minute: 77,
          kickoff: "2026-07-02T12:00:00Z",
          stage: "Group B",
        },
      ],
    })

    const result = await getLiveMatches(supabase as never)

    expect(result).toHaveLength(1)
    expect(supabase.__chains.liveChain.eq).toHaveBeenCalledWith("status", "LIVE")
    expect(result[0]?.status).toBe("LIVE")
  })

  it("attaches predictions when available", async () => {
    const supabase = buildSupabaseMock({
      matches: [
        {
          id: "m2",
          home_team_code: "POR",
          away_team_code: "GER",
          home_score: null,
          away_score: null,
          status: "UPCOMING",
          minute: null,
          kickoff: "2026-07-03T14:00:00Z",
          stage: "Group C",
        },
      ],
      predictions: [{ match_id: "m2", home_score: 1, away_score: 0 }],
    })

    const result = await getMatchesWithPredictions(supabase as never, "user-1")

    expect(result).toHaveLength(1)
    expect(result[0]?.pred).toEqual({ hs: 1, as: 0 })
  })

  it("returns empty array when matches table is empty", async () => {
    const supabase = buildSupabaseMock({ matches: [] })

    const result = await getMatches(supabase as never)

    expect(result).toEqual([])
  })
})
