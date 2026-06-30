// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { BracketMatchCard } from "@/features/bracket/components/bracket-match-card"
import type { BracketMatch } from "@/features/bracket/types"

function buildMatch(overrides: Partial<BracketMatch> = {}): BracketMatch {
  return {
    id: "actual-r16-0",
    matchId: "match-1",
    a: "ARG",
    b: "FRA",
    logoA: null,
    logoB: null,
    sa: null,
    sb: null,
    done: false,
    kickoff: "2026-07-04T18:00:00Z",
    pen: false,
    sap: null,
    sbp: null,
    ...overrides,
  }
}

describe("BracketMatchCard score picker", () => {
  it("renders score steppers for an open match when onPickScore is provided", () => {
    render(<BracketMatchCard match={buildMatch()} onPickScore={vi.fn()} />)
    expect(screen.getByLabelText("Sumar goles ARG")).toBeInTheDocument()
    expect(screen.getByLabelText("Sumar goles FRA")).toBeInTheDocument()
  })

  it("does not render steppers without onPickScore (read-only, e.g. a friend's bracket)", () => {
    render(<BracketMatchCard match={buildMatch()} />)
    expect(screen.queryByLabelText("Sumar goles ARG")).not.toBeInTheDocument()
  })

  it("does not render steppers for a finished match even with onPickScore", () => {
    render(<BracketMatchCard match={buildMatch({ done: true, sa: 2, sb: 1 })} onPickScore={vi.fn()} />)
    expect(screen.queryByLabelText("Sumar goles ARG")).not.toBeInTheDocument()
  })

  it("prefills the stepper with the user's existing pick", () => {
    render(<BracketMatchCard match={buildMatch()} onPickScore={vi.fn()} userScore={{ home: 3, away: 1 }} />)
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })
})
