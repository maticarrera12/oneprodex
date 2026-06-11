// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { GroupPicksStep } from "@/features/onboarding/components/group-picks-step"
import type { GroupCode, OnboardingTeam } from "@/features/onboarding/types"

const GROUPS: GroupCode[] = ["A", "B"]

function buildTeams(group: GroupCode): OnboardingTeam[] {
  return [1, 2, 3, 4].map((n) => ({ code: `${group}${n}`, name: `Team ${group}${n}`, logo: null }))
}

const TEAMS_BY_GROUP = {
  A: buildTeams("A"),
  B: buildTeams("B"),
} as Record<GroupCode, OnboardingTeam[]>

function renderStep(onContinue = vi.fn().mockResolvedValue(undefined)) {
  render(
    <GroupPicksStep groups={GROUPS} teamsByGroup={TEAMS_BY_GROUP} initialRankings={null} onContinue={onContinue} />
  )
  return onContinue
}

function groupCard(group: GroupCode): HTMLElement {
  const card = screen.getByText(`Grupo ${group}`).closest("div")
  if (!card) throw new Error(`No card for group ${group}`)
  return card as HTMLElement
}

function teamRow(name: string): HTMLElement {
  const row = screen.getByText(name).closest("div[draggable]")
  if (!row) throw new Error(`No draggable row for ${name}`)
  return row as HTMLElement
}

function renderedOrder(group: GroupCode): string[] {
  return within(groupCard(group))
    .getAllByText(/Team [AB]\d/)
    .map((node) => node.textContent ?? "")
}

const dataTransfer = { effectAllowed: "", setData: vi.fn(), getData: vi.fn() }

function dragTo(fromName: string, toName: string) {
  fireEvent.dragStart(teamRow(fromName), { dataTransfer })
  fireEvent.dragOver(teamRow(toName), { dataTransfer })
  fireEvent.drop(teamRow(toName), { dataTransfer })
}

describe("GroupPicksStep", () => {
  it("starts complete with the default order and submits positions 1-4 per group", async () => {
    const onContinue = renderStep()

    expect(screen.getByText("2/2")).toBeInTheDocument()
    const submit = screen.getByRole("button", { name: "Confirmar y continuar" })
    expect(submit).toBeEnabled()

    fireEvent.click(submit)
    expect(await screen.findByRole("button", { name: "Confirmar y continuar" })).toBeInTheDocument()

    const formData = onContinue.mock.calls[0]?.[0] as FormData
    const picks = JSON.parse(String(formData.get("picks"))) as Array<{
      group_code: string
      position: number
      team_code: string
    }>
    expect(picks).toHaveLength(8)
    expect(picks.filter((p) => p.group_code === "A").map((p) => p.team_code)).toEqual(["A1", "A2", "A3", "A4"])
    expect(picks.filter((p) => p.group_code === "A").map((p) => p.position)).toEqual([1, 2, 3, 4])
  })

  it("reorders a group when a team is dragged onto another position", () => {
    renderStep()

    dragTo("Team A3", "Team A1")

    expect(renderedOrder("A")).toEqual(["Team A3", "Team A1", "Team A2", "Team A4"])
    expect(renderedOrder("B")).toEqual(["Team B1", "Team B2", "Team B3", "Team B4"])
  })

  it("reflects the new order in the submitted positions", async () => {
    const onContinue = renderStep()

    dragTo("Team A4", "Team A1")
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y continuar" }))
    expect(await screen.findByRole("button", { name: "Confirmar y continuar" })).toBeInTheDocument()

    const formData = onContinue.mock.calls[0]?.[0] as FormData
    const picks = JSON.parse(String(formData.get("picks"))) as Array<{
      group_code: string
      position: number
      team_code: string
    }>
    expect(picks.filter((p) => p.group_code === "A").map((p) => p.team_code)).toEqual(["A4", "A1", "A2", "A3"])
  })

  it("ignores drops coming from a different group", () => {
    renderStep()

    dragTo("Team A1", "Team B2")

    expect(renderedOrder("A")).toEqual(["Team A1", "Team A2", "Team A3", "Team A4"])
    expect(renderedOrder("B")).toEqual(["Team B1", "Team B2", "Team B3", "Team B4"])
  })

  it("shows an error when saving fails", async () => {
    const onContinue = vi.fn().mockRejectedValue(new Error("Teams dataset incomplete"))
    renderStep(onContinue)

    fireEvent.click(screen.getByRole("button", { name: "Confirmar y continuar" }))

    expect(await screen.findByText("Teams dataset incomplete")).toBeInTheDocument()
  })
})
