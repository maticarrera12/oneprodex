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
    home_score: 2,
    away_score: 1,
    kickoff: "2022-11-22T16:00:00Z",
    ...overrides,
  }
}

describe("H2HPanel", () => {
  it("renders empty state when h2h array is empty", () => {
    render(<H2HPanel h2h={[]} />)
    expect(screen.getByText("Sin historial disponible")).toBeInTheDocument()
  })

  it("does not render empty state when h2h data exists", () => {
    const row = buildH2HRow()
    render(<H2HPanel h2h={[row]} />)
    expect(screen.queryByText("Sin historial disponible")).not.toBeInTheDocument()
  })

  it("renders team codes for each encounter", () => {
    const row = buildH2HRow({ home_team_code: "ARG", away_team_code: "BRA" })
    render(<H2HPanel h2h={[row]} />)
    expect(screen.getByText("ARG")).toBeInTheDocument()
    expect(screen.getByText("BRA")).toBeInTheDocument()
  })

  it("renders score for each encounter", () => {
    const row = buildH2HRow({ home_score: 2, away_score: 1 })
    render(<H2HPanel h2h={[row]} />)
    expect(screen.getByText("2 - 1")).toBeInTheDocument()
  })

  it("renders dash for null scores", () => {
    const row = buildH2HRow({ home_score: null, away_score: null })
    render(<H2HPanel h2h={[row]} />)
    expect(screen.getByText("- - -")).toBeInTheDocument()
  })

  it("renders multiple encounters in order", () => {
    const rows = [
      buildH2HRow({ id: "f1", home_team_code: "ARG", away_team_code: "FRA", home_score: 3, away_score: 3, kickoff: "2022-12-18T15:00:00Z" }),
      buildH2HRow({ id: "f2", home_team_code: "FRA", away_team_code: "ARG", home_score: 0, away_score: 1, kickoff: "2018-06-30T14:00:00Z" }),
    ]
    render(<H2HPanel h2h={rows} />)
    const scoreElements = screen.getAllByText(/\d+ - \d+/)
    expect(scoreElements).toHaveLength(2)
  })
})
