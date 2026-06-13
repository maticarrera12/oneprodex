// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { H2HPanel } from "@/features/matches/components/h2h-panel"
import type { MatchH2HRow } from "@/lib/api-football/types"

function buildH2HRow(overrides: Partial<MatchH2HRow> = {}): MatchH2HRow {
  return {
    id: "fixture-1",
    for_match_id: "m1",
    home_team_code: "ARG",
    away_team_code: "BRA",
    home_team_name: "Argentina",
    away_team_name: "Brasil",
    home_score: 2,
    away_score: 1,
    kickoff: "2022-11-22T16:00:00Z",
    league_name: "World Cup",
    season: 2022,
    round: "Group C",
    venue: "Lusail Stadium, Lusail",
    ...overrides,
  }
}

describe("H2HPanel", () => {
  it("renders empty state when h2h array is empty", () => {
    render(<H2HPanel h2h={[]} matchHome="ARG" matchAway="BRA" />)
    expect(screen.getByText("Sin historial disponible")).toBeInTheDocument()
  })

  it("does not render empty state when h2h data exists", () => {
    const row = buildH2HRow()
    render(<H2HPanel h2h={[row]} matchHome="ARG" matchAway="BRA" />)
    expect(screen.queryByText("Sin historial disponible")).not.toBeInTheDocument()
  })

  it("renders team names for each encounter", () => {
    const row = buildH2HRow({ home_team_name: "Argentina", away_team_name: "Brasil" })
    render(<H2HPanel h2h={[row]} matchHome="ARG" matchAway="BRA" />)
    expect(screen.getByText("Argentina")).toBeInTheDocument()
    expect(screen.getByText("Brasil")).toBeInTheDocument()
  })

  it("renders score for each encounter", () => {
    const row = buildH2HRow({ home_score: 2, away_score: 1 })
    render(<H2HPanel h2h={[row]} matchHome="ARG" matchAway="BRA" />)
    expect(screen.getByText("2 - 1")).toBeInTheDocument()
  })

  it("renders competition and venue metadata", () => {
    const row = buildH2HRow()
    render(<H2HPanel h2h={[row]} matchHome="ARG" matchAway="BRA" />)
    expect(screen.getByText(/World Cup · 2022 · Group C/)).toBeInTheDocument()
    expect(screen.getByText(/Lusail Stadium, Lusail/)).toBeInTheDocument()
  })

  it("renders summary from match home perspective", () => {
    const rows = [
      buildH2HRow({ id: "f1", home_score: 2, away_score: 1 }),
      buildH2HRow({ id: "f2", home_team_code: "BRA", away_team_code: "ARG", home_score: 0, away_score: 0 }),
    ]
    render(<H2HPanel h2h={rows} matchHome="ARG" matchAway="BRA" />)
    expect(screen.getByText(/ARG 1G · 1E · 0P vs BRA/)).toBeInTheDocument()
  })

  it("renders multiple encounters in order", () => {
    const rows = [
      buildH2HRow({ id: "f1", home_team_name: "Argentina", away_team_name: "Francia", home_score: 3, away_score: 3, kickoff: "2022-12-18T15:00:00Z" }),
      buildH2HRow({ id: "f2", home_team_name: "Francia", away_team_name: "Argentina", home_score: 0, away_score: 1, kickoff: "2018-06-30T14:00:00Z" }),
    ]
    render(<H2HPanel h2h={rows} matchHome="ARG" matchAway="FRA" />)
    const scoreElements = screen.getAllByText(/\d+ - \d+/)
    expect(scoreElements).toHaveLength(2)
  })
})
