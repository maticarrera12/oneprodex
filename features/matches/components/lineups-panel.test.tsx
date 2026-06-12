// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { LineupsPanel } from "@/features/matches/components/lineups-panel"
import type { MatchLineupRow } from "@/lib/api-football/types"

function buildPlayer(overrides: Partial<MatchLineupRow> = {}): MatchLineupRow {
  return {
    match_id: "m1",
    team_code: "ARG",
    player_api_id: 999,
    name: "Lionel Messi",
    number: 10,
    position: "F",
    grid: "4:1",
    is_substitute: false,
    synced_at: "2026-06-15T10:00:00Z",
    ...overrides,
  }
}

describe("LineupsPanel", () => {
  it("renders empty state when both lineup arrays are empty", () => {
    render(
      <LineupsPanel
        lineups={{ home: [], away: [] }}
        playersMap={new Map()}
      />
    )
    expect(screen.getByText("Alineaciones todavía no disponibles")).toBeInTheDocument()
  })

  it("does not render empty state when lineups have data", () => {
    const player = buildPlayer()
    render(
      <LineupsPanel
        lineups={{ home: [player], away: [] }}
        playersMap={new Map()}
      />
    )
    expect(screen.queryByText("Alineaciones todavía no disponibles")).not.toBeInTheDocument()
  })

  it("renders player name and number when lineups have data", () => {
    const player = buildPlayer({ player_api_id: 100, name: "Lamine Yamal", number: 27 })
    render(
      <LineupsPanel
        lineups={{ home: [player], away: [] }}
        playersMap={new Map()}
      />
    )
    expect(screen.getByText("Lamine Yamal")).toBeInTheDocument()
    expect(screen.getByText("27")).toBeInTheDocument()
  })

  it("renders player photo when player_api_id matches playersMap entry", () => {
    const player = buildPlayer({ player_api_id: 200, name: "Vinicius Jr" })
    const playersMap = new Map([[200, "https://example.com/vini.jpg"]])
    render(
      <LineupsPanel
        lineups={{ home: [player], away: [] }}
        playersMap={playersMap}
      />
    )
    const img = screen.getByAltText("Vinicius Jr") as HTMLImageElement
    expect(img.src).toBe("https://example.com/vini.jpg")
  })

  it("renders initials fallback when player has no matching entry in playersMap", () => {
    const player = buildPlayer({ player_api_id: 888, name: "Carlos Soler" })
    render(
      <LineupsPanel
        lineups={{ home: [player], away: [] }}
        playersMap={new Map()}
      />
    )
    // Initials: "CA" (first two chars of name, uppercased)
    expect(screen.getByText("CA")).toBeInTheDocument()
  })
})
