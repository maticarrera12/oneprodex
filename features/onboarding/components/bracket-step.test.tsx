// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { BracketStep } from "@/features/onboarding/components/bracket-step"
import type { GroupCode, GroupRankings } from "@/features/onboarding/types"

const ALL_GROUPS: GroupCode[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function buildGroupRankings(): GroupRankings {
  return ALL_GROUPS.reduce((acc, group) => {
    acc[group] = [`${group}1`, `${group}2`, `${group}3`, `${group}4`]
    return acc
  }, {} as GroupRankings)
}

// Thirds from groups A–H — "ABCDEFGH" is a known THIRD_PLACE_COMBOS key
const BEST_THIRDS = ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"]

const R32_SLOTS = Array.from({ length: 16 }, (_, i) => `R32_P${i + 1}`)
const R16_SLOTS = Array.from({ length: 8 }, (_, i) => `R16_P${i + 1}`)
const QF_SLOTS = Array.from({ length: 4 }, (_, i) => `QF_P${i + 1}`)
const SF_SLOTS = ["SF_P1", "SF_P2"]

function renderBracket(
  onContinue = vi.fn().mockResolvedValue(undefined),
  onBack?: () => Promise<void>
) {
  render(
    <BracketStep
      groupRankings={buildGroupRankings()}
      bestThirds={BEST_THIRDS}
      initialPicks={null}
      logoByCode={new Map()}
      onContinue={onContinue}
      onBack={onBack}
    />
  )
  return onContinue
}

function getCard(slot: string): HTMLElement {
  const card = screen.getByText(slot).closest("article")
  if (!card) throw new Error(`No match card found for slot ${slot}`)
  return card
}

function teamButtons(slot: string): HTMLElement[] {
  return within(getCard(slot)).getAllByRole("button")
}

function buttonTeam(button: HTMLElement): string {
  return button.textContent?.replace("✓", "").trim() ?? ""
}

function pickFirstTeam(slot: string): string {
  const button = teamButtons(slot)[0]
  const team = buttonTeam(button)
  fireEvent.click(button)
  return team
}

describe("BracketStep", () => {
  it("seeds all 16 R32 matches with no empty slots", () => {
    renderBracket()

    for (const slot of R32_SLOTS) {
      const teams = teamButtons(slot).map(buttonTeam)
      expect(teams).toHaveLength(2)
      expect(teams).not.toContain("---")
    }
    expect(screen.getByText("0/32")).toBeInTheDocument()
  })

  it("disables team buttons for slots that depend on unpicked matches", () => {
    renderBracket()

    for (const button of teamButtons("R16_P1")) {
      expect(buttonTeam(button)).toBe("---")
      expect(button).toBeDisabled()
    }
  })

  it("advances the picked R32 winner into its R16 match", () => {
    renderBracket()

    const winner = pickFirstTeam("R32_P1")

    const r16Teams = teamButtons("R16_P1").map(buttonTeam)
    expect(r16Teams).toContain(winner)
    expect(screen.getByText("1/32")).toBeInTheDocument()
  })

  it("clears downstream picks when an upstream R32 pick changes", () => {
    renderBracket()

    const firstWinner = pickFirstTeam("R32_P1")
    pickFirstTeam("R32_P2")
    const r16Winner = pickFirstTeam("R16_P1")
    expect(r16Winner).toBe(firstWinner)
    expect(screen.getByText("3/32")).toBeInTheDocument()

    // change the R32_P1 pick to the other team → R16_P1 pick must reset
    const [, loserButton] = teamButtons("R32_P1")
    const newWinner = buttonTeam(loserButton)
    fireEvent.click(loserButton)

    expect(screen.getByText("2/32")).toBeInTheDocument()
    const r16Teams = teamButtons("R16_P1").map(buttonTeam)
    expect(r16Teams).toContain(newWinner)
    expect(r16Teams).not.toContain(firstWinner)
  })

  it("shows the semifinal losers in the third-place match", () => {
    renderBracket()

    for (const slot of R32_SLOTS) pickFirstTeam(slot)
    for (const slot of R16_SLOTS) pickFirstTeam(slot)
    for (const slot of QF_SLOTS) pickFirstTeam(slot)

    const sf1Teams = teamButtons("SF_P1").map(buttonTeam)
    const sf2Teams = teamButtons("SF_P2").map(buttonTeam)
    const sf1Winner = pickFirstTeam("SF_P1")
    const sf2Winner = pickFirstTeam("SF_P2")

    const sf1Loser = sf1Teams.find((t) => t !== sf1Winner)
    const sf2Loser = sf2Teams.find((t) => t !== sf2Winner)
    const thirdTeams = teamButtons("THIRD").map(buttonTeam)
    expect(thirdTeams).toEqual([sf1Loser, sf2Loser])

    const finalTeams = teamButtons("FINAL").map(buttonTeam)
    expect(finalTeams).toEqual([sf1Winner, sf2Winner])
  })

  it("keeps submit disabled until all 32 picks are made, then submits them", async () => {
    const onContinue = renderBracket()
    const submit = screen.getByRole("button", { name: "Confirmar y continuar" })

    expect(submit).toBeDisabled()

    for (const slot of R32_SLOTS) pickFirstTeam(slot)
    for (const slot of R16_SLOTS) pickFirstTeam(slot)
    for (const slot of QF_SLOTS) pickFirstTeam(slot)
    for (const slot of SF_SLOTS) pickFirstTeam(slot)
    pickFirstTeam("THIRD")
    expect(submit).toBeDisabled()
    pickFirstTeam("FINAL")

    expect(screen.getByText("32/32")).toBeInTheDocument()
    expect(submit).toBeEnabled()

    fireEvent.click(submit)
    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeInTheDocument()

    expect(onContinue).toHaveBeenCalledTimes(1)
    const formData = onContinue.mock.calls[0]?.[0] as FormData
    const picks = JSON.parse(String(formData.get("picks"))) as Array<{ slot: string; team_code: string }>
    expect(picks).toHaveLength(32)
    expect(new Set(picks.map((p) => p.slot)).size).toBe(32)
  })

  it("shows an error and keeps picks when saving fails", async () => {
    const onContinue = vi.fn().mockRejectedValue(new Error("No se pudo guardar el bracket."))
    renderBracket(onContinue)

    for (const slot of R32_SLOTS) pickFirstTeam(slot)
    for (const slot of R16_SLOTS) pickFirstTeam(slot)
    for (const slot of QF_SLOTS) pickFirstTeam(slot)
    for (const slot of SF_SLOTS) pickFirstTeam(slot)
    pickFirstTeam("THIRD")
    pickFirstTeam("FINAL")

    fireEvent.click(screen.getByRole("button", { name: "Confirmar y continuar" }))

    expect(await screen.findByText("No se pudo guardar el bracket.")).toBeInTheDocument()
    expect(screen.getByText("32/32")).toBeInTheDocument()
  })

  it("calls onBack when the user taps Cambiar modo", async () => {
    const onBack = vi.fn().mockResolvedValue(undefined)
    renderBracket(undefined, onBack)

    fireEvent.click(screen.getByRole("button", { name: "← Cambiar modo" }))

    await vi.waitFor(() => {
      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })
})
