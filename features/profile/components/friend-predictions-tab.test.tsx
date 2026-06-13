// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { FriendPredictionsTab } from "@/features/profile/components/friend-predictions-tab"
import type { FriendPredictionsTabData } from "@/features/profile/api"

function makeFinished(id: string): FriendPredictionsTabData["finished"][number] {
  return {
    matchId: id,
    homeTeam: "Argentina",
    awayTeam: "Brasil",
    homeLogo: null,
    awayLogo: null,
    kickoff: "2026-06-10T18:00:00Z",
    status: "FINISHED",
    predictedHome: 2,
    predictedAway: 1,
    actualHome: 2,
    actualAway: 1,
    pts: 3,
    kind: "exact",
  }
}

function makeLive(id: string): FriendPredictionsTabData["live"][number] {
  return {
    matchId: id,
    homeTeam: "France",
    awayTeam: "Germany",
    homeLogo: null,
    awayLogo: null,
    kickoff: "2026-06-14T18:00:00Z",
    status: "LIVE",
    predictedHome: 1,
    predictedAway: 0,
    actualHome: 1,
    actualAway: 0,
    pts: null,
    kind: null,
  }
}

function makeUpcoming(id: string, hasPick: boolean): FriendPredictionsTabData["upcomingNext5"][number] {
  return {
    matchId: id,
    homeTeam: "Spain",
    awayTeam: "Italy",
    homeLogo: null,
    awayLogo: null,
    kickoff: "2026-06-20T18:00:00Z",
    predictedHome: hasPick ? 1 : null,
    predictedAway: hasPick ? 0 : null,
  }
}

describe("FriendPredictionsTab", () => {
  it("renders empty-state message when all arrays are empty", () => {
    const data: FriendPredictionsTabData = { finished: [], live: [], upcomingNext5: [] }
    render(<FriendPredictionsTab data={data} />)
    expect(screen.getByText(/sin predicciones/i)).toBeInTheDocument()
  })

  it("renders the live section when live matches exist", () => {
    const data: FriendPredictionsTabData = {
      finished: [],
      live: [makeLive("l1")],
      upcomingNext5: [],
    }
    render(<FriendPredictionsTab data={data} />)
    expect(screen.getByText(/en vivo/i)).toBeInTheDocument()
    expect(screen.getByText("France")).toBeInTheDocument()
  })

  it("renders the finished section when finished matches exist", () => {
    const data: FriendPredictionsTabData = {
      finished: [makeFinished("f1"), makeFinished("f2")],
      live: [],
      upcomingNext5: [],
    }
    render(<FriendPredictionsTab data={data} />)
    expect(screen.getByText(/jugados/i)).toBeInTheDocument()
    expect(screen.getAllByText("Argentina")).toHaveLength(2)
  })

  it("renders the upcoming section with 'Sin predicción' for entries without a pick", () => {
    const data: FriendPredictionsTabData = {
      finished: [],
      live: [],
      upcomingNext5: [makeUpcoming("u1", true), makeUpcoming("u2", false)],
    }
    render(<FriendPredictionsTab data={data} />)
    expect(screen.getByText(/próximos/i)).toBeInTheDocument()
    expect(screen.getByText(/sin predicción/i)).toBeInTheDocument()
  })

  it("LIVE entry with a pick does NOT get the red miss class (W1)", () => {
    const data: FriendPredictionsTabData = {
      finished: [],
      live: [makeLive("l1")],
      upcomingNext5: [],
    }
    render(<FriendPredictionsTab data={data} />)
    // The prediction pill shows "1 - 0" (the live pick)
    const pill = screen.getByText("1 - 0")
    // Must NOT carry the red miss class tokens
    expect(pill.className).not.toContain("text-red-400")
    expect(pill.className).not.toContain("bg-red-400")
  })
})
