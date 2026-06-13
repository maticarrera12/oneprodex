// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProfileHistoryList } from "@/features/profile/components/profile-history-list"
import type { ProfileHistoryEntry } from "@/features/profile/types"

function makeEntry(): ProfileHistoryEntry {
  return {
    date: "10 Jun",
    homeTeam: "Argentina",
    homeFlag: "ARG",
    homeLogo: null,
    awayTeam: "Brasil",
    awayFlag: "BRA",
    awayLogo: null,
    myPrediction: "2-1",
    result: "2-1",
    pts: 3,
    kind: "exact",
    phase: "grupos",
  }
}

describe("ProfileHistoryList", () => {
  it("shows the 'Ver todas mis predicciones' link to /partidos by default (own profile)", () => {
    render(<ProfileHistoryList entries={[makeEntry()]} />)
    expect(
      screen.getByRole("link", { name: /ver todas mis predicciones/i }),
    ).toHaveAttribute("href", "/partidos")
  })

  it("hides the link when showSeeAll is false (friend profile)", () => {
    render(<ProfileHistoryList entries={[makeEntry()]} showSeeAll={false} />)
    expect(
      screen.queryByRole("link", { name: /ver todas mis predicciones/i }),
    ).toBeNull()
  })
})
