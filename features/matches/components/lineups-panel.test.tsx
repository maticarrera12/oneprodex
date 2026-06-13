// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
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
        homeCode="ARG"
        awayCode="BRA"
      />,
    )
    expect(screen.getByText("Alineaciones todavía no disponibles")).toBeInTheDocument()
  })

  it("renders player name and number when lineups have data", () => {
    const player = buildPlayer({ player_api_id: 100, name: "Lamine Yamal", number: 27 })
    render(
      <LineupsPanel
        lineups={{ home: [player], away: [] }}
        playersMap={new Map()}
        homeCode="ARG"
        awayCode="BRA"
      />,
    )
    expect(screen.getByText("Lamine Yamal")).toBeInTheDocument()
    expect(screen.getByText("27")).toBeInTheDocument()
  })

  it("shows both teams side by side on desktop layout container", () => {
    const home = buildPlayer({ player_api_id: 1, name: "Home Player", team_code: "ARG" })
    const away = buildPlayer({ player_api_id: 2, name: "Away Player", team_code: "BRA" })
    render(
      <LineupsPanel
        lineups={{ home: [home], away: [away] }}
        playersMap={new Map()}
        homeCode="ARG"
        awayCode="BRA"
      />,
    )
    expect(screen.getByText("Home Player")).toBeInTheDocument()
    expect(screen.getByText("Away Player")).toBeInTheDocument()
    expect(screen.getAllByText("Titulares · 1")).toHaveLength(2)
  })

  it("shows mobile tabs when both lineups are available", () => {
    const home = buildPlayer({ player_api_id: 1, name: "Home Player" })
    const away = buildPlayer({ player_api_id: 2, name: "Away Player", team_code: "BRA" })
    render(
      <LineupsPanel
        lineups={{ home: [home], away: [away] }}
        playersMap={new Map()}
        homeCode="ARG"
        awayCode="BRA"
      />,
    )
    expect(screen.getByRole("button", { name: /ARG/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /BRA/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /BRA/ }))
    expect(screen.getByText("Away Player")).toBeInTheDocument()
  })

  it("renders pending card on desktop when only away lineup exists", () => {
    const away = buildPlayer({ player_api_id: 2, name: "Away Player", team_code: "BRA" })
    render(
      <LineupsPanel
        lineups={{ home: [], away: [away] }}
        playersMap={new Map()}
        homeCode="ARG"
        awayCode="BRA"
      />,
    )
    expect(screen.getByText("Alineación pendiente")).toBeInTheDocument()
    expect(screen.getByText("Away Player")).toBeInTheDocument()
  })
})
