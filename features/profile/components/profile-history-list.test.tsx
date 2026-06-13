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
  it("on the own profile: shows the CTA to /partidos and the 'Tu pred.' header", () => {
    render(<ProfileHistoryList entries={[makeEntry()]} />)
    expect(
      screen.getByRole("link", { name: /ver todas mis predicciones/i }),
    ).toHaveAttribute("href", "/partidos")
    expect(screen.getByText("Tu pred.")).toBeTruthy()
    expect(screen.queryByText("Su pred.")).toBeNull()
  })

  it("on a friend's profile (isOwnProfile=false): hides the CTA and shows 'Su pred.'", () => {
    render(<ProfileHistoryList entries={[makeEntry()]} isOwnProfile={false} />)
    expect(
      screen.queryByRole("link", { name: /ver todas mis predicciones/i }),
    ).toBeNull()
    expect(screen.getByText("Su pred.")).toBeTruthy()
    expect(screen.queryByText("Tu pred.")).toBeNull()
  })
})
